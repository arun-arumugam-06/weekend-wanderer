import { RequestHandler } from "express";
import { TripPlanRequest, TripPlanResponse, Itinerary, Attraction, ItineraryItem } from "@shared/api";
import { generateIndianAttractions, generateIndianTransportSuggestions, getIndianFallbackAttractions } from "../services/gemini";

// In production, this would be a proper database
const itineraries: Itinerary[] = [];

// US mock attractions removed - now using Gemini for Indian attractions

// Helper function to get attractions near a location using Gemini
const getAttractionsNearLocation = async (location: string, startDate: string, endDate: string): Promise<Attraction[]> => {
  console.log(`🎯 Getting attractions for: ${location}`);

  try {
    const attractions = await generateIndianAttractions({
      location,
      startDate,
      endDate,
      maxAttractions: 5
    });
    console.log(`✅ Generated ${attractions.length} attractions for ${location}:`, attractions.map(a => a.name));
    return attractions;
  } catch (error) {
    console.error("❌ Error fetching attractions from Gemini:", error);

    // Use Indian fallback based on location instead of US mock data
    const { getIndianFallbackAttractions } = require("../services/gemini");
    const fallbackAttractions = getIndianFallbackAttractions(location);
    console.log(`🔄 Using fallback attractions for ${location}:`, fallbackAttractions.map(a => a.name));
    return fallbackAttractions;
  }
};

// Helper function to create optimized itinerary
const createOptimizedItinerary = async (
  attractions: Attraction[],
  startDate: string,
  endDate: string
): Promise<ItineraryItem[]> => {
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
          type: 'auto_rickshaw',
          duration: bufferTime,
          distance: 1500, // 1.5km default for Indian cities
          cost: 60 // ₹60 average auto fare
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
  
  // Add estimated meal costs (2 meals per day at ₹300 each)
  const days = Math.ceil(items.length / 4); // Assuming 4 activities per day
  total += days * 2 * 300; // ₹300 per meal in India
  
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
    const attractions = await getAttractionsNearLocation(location, startDate, endDate);

    if (attractions.length === 0) {
      const response: TripPlanResponse = {
        success: false,
        message: "No attractions found near the specified location"
      };
      return res.status(404).json(response);
    }

    // Create optimized itinerary
    const items = await createOptimizedItinerary(attractions, startDate, endDate);
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
