import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Clock, Compass, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TripPlanResponse } from "@shared/api";

export default function Index() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setUserName(userData.name);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const clearAllCachedData = () => {
    // Clear all trip-related cached data
    localStorage.removeItem("currentItinerary");
    localStorage.removeItem("lastTripLocation");
    localStorage.removeItem("tripCache");
    console.log("🗑️ Cleared all cached trip data");
  };

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !location) {
      setError("Please fill in all fields");
      return;
    }

    setIsPlanning(true);
    setError("");

    // Clear any existing itinerary data
    clearAllCachedData();

    try {
      // Check if user is logged in
      const token = localStorage.getItem("token");
      if (!token) {
        // Redirect to signup for unauthenticated users
        navigate("/signup");
        return;
      }

      const response = await fetch("/api/trips/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          location,
        }),
      });

      const data: TripPlanResponse = await response.json();

      if (data.success && data.itinerary) {
        // Clear any old cached data first
        localStorage.removeItem("currentItinerary");

        // Store the fresh itinerary and redirect to view it
        localStorage.setItem("currentItinerary", JSON.stringify(data.itinerary));
        console.log("✅ New itinerary created:", data.itinerary.location, data.itinerary.items.map(i => i.attraction.name));
        navigate("/itinerary?fresh=true");
      } else {
        setError(data.message || "Failed to plan trip");
      }
    } catch (error) {
      console.error("Trip planning error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Weekend Wanderer</h1>
                <p className="text-xs text-gray-500">Plan your perfect getaway</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome back, {userName}!
                  </span>
                  <Link to="/dashboard">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                      My Trips
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Plan Your Perfect
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Weekend</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover amazing places, create personalized itineraries, and make the most of your weekends with intelligent trip planning powered by real-time data.
            </p>
          </div>

          {/* Main Planning Form */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Plan Your Weekend Adventure</CardTitle>
                <CardDescription className="text-gray-600">
                  Tell us when and where you want to go, and we'll create the perfect itinerary for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlanTrip} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Start Date & Time
                      </Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        End Date & Time
                      </Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Preferred Location
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="Enter city name or pin code (e.g., New York, 10001)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isPlanning}
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                    >
                      {isPlanning ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Planning Your Adventure...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Compass className="w-5 h-5" />
                          Create My Itinerary
                        </div>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearAllCachedData}
                      className="w-full text-sm"
                    >
                      Clear Cached Data & Refresh
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Weekend Wanderer?</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our intelligent planning engine creates personalized itineraries based on real-time data and your preferences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Smart Location Discovery</h4>
              <p className="text-gray-600">
                Find the best attractions and hidden gems near your destination using real-time data from multiple sources
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Optimized Scheduling</h4>
              <p className="text-gray-600">
                Get perfectly timed itineraries that maximize your experience while minimizing travel time between locations
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Cost Estimation</h4>
              <p className="text-gray-600">
                Know exactly how much your trip will cost with detailed breakdowns for transport, meals, and activities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Trips Planned</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9</div>
              <div className="text-blue-100 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-current" />
                User Rating
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Weekend Wanderer</span>
              </div>
              <p className="text-gray-400">
                Making every weekend an adventure worth remembering.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Product</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Weekend Wanderer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
