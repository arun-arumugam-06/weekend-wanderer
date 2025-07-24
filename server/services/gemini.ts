import { GoogleGenerativeAI } from "@google/generative-ai";
import { Attraction } from "@shared/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface GeminiAttractionRequest {
  location: string;
  startDate: string;
  endDate: string;
  maxAttractions?: number;
}

export async function generateIndianAttractions(request: GeminiAttractionRequest): Promise<Attraction[]> {
  console.log("🚀 Starting Gemini API call for:", request.location);

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key not found in environment variables");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate a JSON array of ${request.maxAttractions || 5} real tourist attractions in ${request.location}, India.

Format (return ONLY this JSON, no other text):
[
  {
    "name": "Marina Beach",
    "description": "Second longest urban beach in the world, perfect for evening walks",
    "category": "Beach",
    "rating": 4.3,
    "estimatedDuration": 120,
    "entryFee": 0,
    "coordinates": {"lat": 13.0515, "lng": 80.2825}
  }
]

Requirements:
- REAL places in ${request.location}, India only
- Entry fees in Indian Rupees (₹)
- Duration in minutes (60-240)
- Include temples, monuments, parks, museums
- Accurate coordinates for the city`;

    console.log("📤 Sending prompt to Gemini...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("📥 Gemini response:", text.substring(0, 200) + "...");

    // Clean the response (remove markdown formatting if present)
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    // Parse the JSON response
    const attractions = JSON.parse(cleanText);
    console.log("✅ Parsed attractions:", attractions.length);

    // Add unique IDs and validate data
    return attractions.map((attraction: any, index: number) => ({
      id: `gemini_${Date.now()}_${index}`,
      name: attraction.name || "Unknown Attraction",
      description: attraction.description || "No description available",
      category: attraction.category || "Landmark",
      rating: Math.min(Math.max(attraction.rating || 4.0, 3.0), 5.0),
      coordinates: {
        lat: attraction.coordinates?.lat || 0,
        lng: attraction.coordinates?.lng || 0
      },
      estimatedDuration: Math.min(Math.max(attraction.estimatedDuration || 90, 30), 480),
      entryFee: Math.max(attraction.entryFee || 0, 0)
    }));

  } catch (error) {
    console.error("❌ Error generating attractions with Gemini:", error);

    // Fallback: Return India-specific attractions based on common locations
    return getIndianFallbackAttractions(request.location);
  }
}

export function getIndianFallbackAttractions(location: string): Attraction[] {
  const locationLower = location.toLowerCase();
  
  // Basic Indian attractions based on major cities
  if (locationLower.includes("chennai") || locationLower.includes("madras")) {
    return [
      {
        id: "fallback_chennai_1",
        name: "Marina Beach",
        description: "World's second longest urban beach perfect for evening walks and street food",
        category: "Beach",
        rating: 4.3,
        coordinates: { lat: 13.0515, lng: 80.2825 },
        estimatedDuration: 120,
        entryFee: 0
      },
      {
        id: "fallback_chennai_2", 
        name: "Kapaleeshwarar Temple",
        description: "Ancient Dravidian temple dedicated to Lord Shiva with stunning architecture",
        category: "Temple",
        rating: 4.5,
        coordinates: { lat: 13.0339, lng: 80.2619 },
        estimatedDuration: 90,
        entryFee: 0
      },
      {
        id: "fallback_chennai_3",
        name: "Fort St. George",
        description: "Historic British fort and museum showcasing colonial heritage",
        category: "Monument",
        rating: 4.1,
        coordinates: { lat: 13.0858, lng: 80.2836 },
        estimatedDuration: 120,
        entryFee: 30
      }
    ];
  }
  
  if (locationLower.includes("mumbai") || locationLower.includes("bombay")) {
    return [
      {
        id: "fallback_mumbai_1",
        name: "Gateway of India",
        description: "Iconic monument overlooking the Arabian Sea and symbol of Mumbai",
        category: "Monument",
        rating: 4.4,
        coordinates: { lat: 18.9220, lng: 72.8347 },
        estimatedDuration: 90,
        entryFee: 0
      },
      {
        id: "fallback_mumbai_2",
        name: "Marine Drive",
        description: "Queen's Necklace - beautiful coastline perfect for evening walks",
        category: "Beach",
        rating: 4.3,
        coordinates: { lat: 18.9439, lng: 72.8236 },
        estimatedDuration: 120,
        entryFee: 0
      }
    ];
  }
  
  if (locationLower.includes("delhi") || locationLower.includes("new delhi")) {
    return [
      {
        id: "fallback_delhi_1",
        name: "Red Fort",
        description: "Magnificent Mughal fortress and UNESCO World Heritage Site",
        category: "Fort",
        rating: 4.6,
        coordinates: { lat: 28.6562, lng: 77.2410 },
        estimatedDuration: 150,
        entryFee: 50
      },
      {
        id: "fallback_delhi_2",
        name: "India Gate",
        description: "War memorial and iconic landmark in the heart of New Delhi",
        category: "Monument", 
        rating: 4.5,
        coordinates: { lat: 28.6129, lng: 77.2295 },
        estimatedDuration: 90,
        entryFee: 0
      }
    ];
  }
  
  // Generic Indian attractions for other cities
  return [
    {
      id: "fallback_generic_1",
      name: "Local Temple",
      description: "Beautiful temple showcasing regional architecture and culture",
      category: "Temple",
      rating: 4.2,
      coordinates: { lat: 20.5937, lng: 78.9629 }, // Center of India
      estimatedDuration: 90,
      entryFee: 0
    },
    {
      id: "fallback_generic_2",
      name: "City Market",
      description: "Bustling local market perfect for shopping and street food",
      category: "Market", 
      rating: 4.0,
      coordinates: { lat: 20.5937, lng: 78.9629 },
      estimatedDuration: 120,
      entryFee: 0
    }
  ];
}

export async function generateIndianTransportSuggestions(
  fromLocation: string, 
  toLocation: string,
  distance: number
): Promise<any[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Generate realistic transport options between two locations in India with distance ${distance}m.
Consider Indian transport modes: Auto-rickshaw, Metro, Bus, Taxi, Walking.

Return JSON array:
[
  {
    "type": "auto_rickshaw",
    "duration": 15,
    "distance": ${distance},
    "cost": 80
  }
]

Rules:
- Costs in Indian Rupees (₹)
- Duration in minutes  
- Use realistic Indian pricing
- Include 2-3 options maximum
- Consider distance: <500m walking only, 500m-5km auto/metro, >5km taxi/bus

Return ONLY JSON array, no explanation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Error generating transport:", error);
    
    // Fallback transport options
    if (distance < 500) {
      return [{ type: "walking", duration: Math.ceil(distance / 80), distance, cost: 0 }];
    } else if (distance < 2000) {
      return [
        { type: "walking", duration: Math.ceil(distance / 80), distance, cost: 0 },
        { type: "auto_rickshaw", duration: Math.ceil(distance / 300), distance, cost: Math.max(30, distance * 0.02) }
      ];
    } else {
      return [
        { type: "auto_rickshaw", duration: Math.ceil(distance / 300), distance, cost: Math.max(50, distance * 0.015) },
        { type: "taxi", duration: Math.ceil(distance / 400), distance, cost: Math.max(100, distance * 0.025) }
      ];
    }
  }
}
