import { RequestHandler } from "express";
import { TripPlanRequest, TripPlanResponse, Itinerary, Attraction, ItineraryItem } from "@shared/api";
import { generateIndianAttractions, generateIndianTransportSuggestions } from "../services/gemini";

// In production, this would be a proper database
const itineraries: Itinerary[] = [];

// Mock attractions data (in production, this would come from external APIs)
const mockAttractions: Attraction[] = [
  {
    id: "attr_1",
    name: "Central Park",
    description: "A large public park in Manhattan, perfect for walking and relaxing",
    category: "Park",
    rating: 4.5,
    coordinates: { lat: 40.7829, lng: -73.9654 },
    estimatedDuration: 120,
    entryFee: 0
  },
  {
    id: "attr_2", 
    name: "Metropolitan Museum of Art",
    description: "World-renowned art museum with extensive collections",
    category: "Museum",
    rating: 4.7,
    coordinates: { lat: 40.7794, lng: -73.9632 },
    estimatedDuration: 180,
    entryFee: 25
  },
  {
    id: "attr_3",
    name: "Times Square",
    description: "Iconic commercial intersection and entertainment hub",
    category: "Landmark",
    rating: 4.2,
    coordinates: { lat: 40.7580, lng: -73.9855 },
    estimatedDuration: 90,
    entryFee: 0
  },
  {
    id: "attr_4",
    name: "Brooklyn Bridge",
    description: "Historic suspension bridge connecting Manhattan and Brooklyn",
    category: "Landmark", 
    rating: 4.6,
    coordinates: { lat: 40.7061, lng: -73.9969 },
    estimatedDuration: 60,
    entryFee: 0
  },
  {
    id: "attr_5",
    name: "High Line",
    description: "Elevated linear park built on former railway tracks",
    category: "Park",
    rating: 4.4,
    coordinates: { lat: 40.7480, lng: -74.0048 },
    estimatedDuration: 90,
    entryFee: 0
  }
];

// Helper function to get attractions near a location using Gemini
const getAttractionsNearLocation = async (location: string, startDate: string, endDate: string): Promise<Attraction[]> => {
  try {
    return await generateIndianAttractions({
      location,
      startDate,
      endDate,
      maxAttractions: 5
    });
  } catch (error) {
    console.error("Error fetching attractions:", error);
    // Fallback to mock data if Gemini fails
    return mockAttractions.slice(0, 4);
  }
};

// Helper function to create optimized itinerary
const createOptimizedItinerary = (
  attractions: Attraction[], 
  startDate: string, 
  endDate: string
): ItineraryItem[] => {
  const items: ItineraryItem[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate available time in minutes
  const totalTime = (end.getTime() - start.getTime()) / (1000 * 60);
  
  let currentTime = new Date(start);
  let remainingTime = totalTime;
  
  // Add buffer time between activities (30 minutes for travel)
  const bufferTime = 30;
  
  for (let i = 0; i < attractions.length && remainingTime > 0; i++) {
    const attraction = attractions[i];
    const timeNeeded = attraction.estimatedDuration + (i > 0 ? bufferTime : 0);
    
    if (timeNeeded <= remainingTime) {
      const itemStart = new Date(currentTime);
      const itemEnd = new Date(currentTime.getTime() + attraction.estimatedDuration * 60000);
      
      const item: ItineraryItem = {
        id: `item_${Date.now()}_${i}`,
        attraction,
        startTime: itemStart.toISOString(),
        endTime: itemEnd.toISOString(),
        transportToNext: i < attractions.length - 1 ? {
          type: 'walking',
          duration: bufferTime,
          distance: 1000, // 1km default
          cost: 0
        } : undefined
      };
      
      items.push(item);
      currentTime = new Date(itemEnd.getTime() + bufferTime * 60000);
      remainingTime -= timeNeeded;
    }
  }
  
  return items;
};

// Helper function to calculate total cost
const calculateTotalCost = (items: ItineraryItem[]): number => {
  let total = 0;
  
  items.forEach(item => {
    // Entry fees
    if (item.attraction.entryFee) {
      total += item.attraction.entryFee;
    }
    
    // Transport costs
    if (item.transportToNext?.cost) {
      total += item.transportToNext.cost;
    }
  });
  
  // Add estimated meal costs (2 meals per day at $15 each)
  const days = Math.ceil(items.length / 4); // Assuming 4 activities per day
  total += days * 2 * 15;
  
  return total;
};

export const handlePlanTrip: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate, location }: TripPlanRequest = req.body;
    const userId = (req as any).userId;

    // Validate input
    if (!startDate || !endDate || !location) {
      const response: TripPlanResponse = {
        success: false,
        message: "Start date, end date, and location are required"
      };
      return res.status(400).json(response);
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      const response: TripPlanResponse = {
        success: false,
        message: "End date must be after start date"
      };
      return res.status(400).json(response);
    }

    // Get attractions near location
    const attractions = getAttractionsNearLocation(location);
    
    if (attractions.length === 0) {
      const response: TripPlanResponse = {
        success: false,
        message: "No attractions found near the specified location"
      };
      return res.status(404).json(response);
    }

    // Create optimized itinerary
    const items = createOptimizedItinerary(attractions, startDate, endDate);
    const totalCost = calculateTotalCost(items);

    // Create itinerary object
    const itinerary: Itinerary = {
      id: `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId || "anonymous",
      location,
      startDate,
      endDate,
      items,
      totalCost,
      createdAt: new Date().toISOString()
    };

    // Store itinerary
    itineraries.push(itinerary);

    const response: TripPlanResponse = {
      success: true,
      itinerary,
      message: "Trip planned successfully"
    };

    res.json(response);
  } catch (error) {
    console.error("Trip planning error:", error);
    const response: TripPlanResponse = {
      success: false,
      message: "Internal server error"
    };
    res.status(500).json(response);
  }
};

export const handleGetUserItineraries: RequestHandler = (req, res) => {
  try {
    const userId = (req as any).userId;
    const userItineraries = itineraries.filter(itinerary => itinerary.userId === userId);
    
    res.json({
      success: true,
      itineraries: userItineraries
    });
  } catch (error) {
    console.error("Get itineraries error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const handleGetItinerary: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    
    const itinerary = itineraries.find(
      item => item.id === id && item.userId === userId
    );
    
    if (!itinerary) {
      return res.status(404).json({ success: false, message: "Itinerary not found" });
    }
    
    res.json({
      success: true,
      itinerary
    });
  } catch (error) {
    console.error("Get itinerary error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
