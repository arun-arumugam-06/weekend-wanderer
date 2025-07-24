/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Trip Planning Types
export interface TripPlanRequest {
  startDate: string;
  endDate: string;
  location: string;
  userId?: string;
}

export interface Attraction {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  estimatedDuration: number; // in minutes
  entryFee?: number;
}

export interface TransportOption {
  type: 'walking' | 'driving' | 'public_transport';
  duration: number; // in minutes
  distance: number; // in meters
  cost?: number;
}

export interface ItineraryItem {
  id: string;
  attraction: Attraction;
  startTime: string;
  endTime: string;
  transportToNext?: TransportOption;
}

export interface Itinerary {
  id: string;
  userId: string;
  location: string;
  startDate: string;
  endDate: string;
  items: ItineraryItem[];
  totalCost: number;
  createdAt: string;
}

export interface TripPlanResponse {
  success: boolean;
  itinerary?: Itinerary;
  message?: string;
}
