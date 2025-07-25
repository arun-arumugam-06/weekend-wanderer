import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Calendar, MapPin, Settings, Bell, Search, Plus, LogOut, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Itinerary } from "@shared/api";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
      fetchItineraries();
    } catch (error) {
      console.error("Error loading user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  const fetchItineraries = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("📋 No token found, redirecting to login");
        navigate("/login");
        return;
      }

      console.log("📋 Fetching user itineraries...");
      const response = await fetch("/api/trips", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setItineraries(data.itineraries || []);
          console.log(`📋 Loaded ${data.total || 0} saved itineraries`);

          // Update local storage with latest data
          if (data.itineraries && data.itineraries.length > 0) {
            localStorage.setItem("userItineraries", JSON.stringify(data.itineraries));
          }
        }
      } else if (response.status === 401) {
        // Token expired or invalid
        console.log("🔒 Authentication expired, redirecting to login");
        localStorage.clear();
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching itineraries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    console.log("🚪 Signing out user...");

    // Clear all local storage data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentItinerary");
    localStorage.removeItem("userItineraries");

    console.log("🧹 Cleared local data, itineraries remain saved on server");
    console.log("🏠 Redirecting to homepage");

    // Redirect to homepage
    navigate("/");
  };

  const handleDeleteTrip = async (tripId: string, tripLocation: string) => {
    if (!confirm(`Are you sure you want to delete the trip to ${tripLocation}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log(`🗑️ Deleted trip: ${tripLocation}`);
        // Remove from local state
        setItineraries(prev => prev.filter(item => item.id !== tripId));

        // Update local storage
        const updatedItineraries = itineraries.filter(item => item.id !== tripId);
        localStorage.setItem("userItineraries", JSON.stringify(updatedItineraries));
      } else {
        alert("Failed to delete trip. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleToggleFavorite = (tripId: string) => {
    setItineraries(prev =>
      prev.map(item =>
        item.id === tripId
          ? { ...item, isFavorite: !item.isFavorite }
          : item
      )
    );

    // Update local storage
    const updatedItineraries = itineraries.map(item =>
      item.id === tripId
        ? { ...item, isFavorite: !item.isFavorite }
        : item
    );
    localStorage.setItem("userItineraries", JSON.stringify(updatedItineraries));
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      {/* Header */}
      <header className="glass-navbar sticky top-0 z-50 smooth-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative w-11 h-11 float-animation">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg smooth-transition"></div>
                <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-inner"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-5 h-5">
                    <Compass className="w-5 h-5 text-brand-600" />
                    <div className="absolute top-0.5 left-1/2 w-0.5 h-1.5 bg-red-500 rounded-full transform -translate-x-1/2"></div>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
                  Weekend Wanderer
                </h1>
                <p className="text-xs text-gray-600">Plan your perfect getaway</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name || "Traveler"}!
              </span>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name || "Traveler"}!</h2>
          <p className="text-gray-600">Ready to plan your next weekend adventure?</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card stagger-item">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Recent Itineraries
                  </CardTitle>
                  <CardDescription>
                    Your latest weekend plans and adventures
                  </CardDescription>
                </div>
                {itineraries.length > 0 && (
                  <Link to="/">
                    <Button size="sm" className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      New Trip
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {itineraries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved trips yet</h3>
                    <p className="text-gray-600 mb-6">Start planning your first weekend adventure!</p>
                    <Link to="/">
                      <Button className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg">
                        Plan Your First Trip
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itineraries.slice(0, 5).map((itinerary) => (
                      <div key={itinerary.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{itinerary.location}</h4>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {itinerary.items.length} stops
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {itinerary.items.length} attractions • ₹{itinerary.totalCost} • Created {new Date(itinerary.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${itinerary.isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                              onClick={() => handleToggleFavorite(itinerary.id)}
                            >
                              <Heart className={`w-4 h-4 ${itinerary.isFavorite ? 'fill-current' : ''}`} />
                            </Button>
                            <Link to={`/itinerary/${itinerary.id}`}>
                              <Button variant="outline" size="sm">
                                <MapPin className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteTrip(itinerary.id, itinerary.location)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {itineraries.length > 5 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" className="w-full">
                          View All {itineraries.length} Trips
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card stagger-item">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Jump back into planning or explore new features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to="/">
                    <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                      <Plus className="w-6 h-6" />
                      <span>Plan New Trip</span>
                    </Button>
                  </Link>
                  <Button variant="outline" className="h-20 flex-col space-y-2" disabled>
                    <Search className="w-6 h-6" />
                    <span>Find Destinations</span>
                    <span className="text-xs text-gray-400">(Coming Soon)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-card stagger-item">
              <CardHeader>
                <CardTitle>Travel Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{itineraries.length}</div>
                    <div className="text-sm text-gray-600">Trips Planned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {new Set(itineraries.map(i => i.location)).size}
                    </div>
                    <div className="text-sm text-gray-600">Cities Visited</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{itineraries.reduce((total, i) => total + i.totalCost, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Planned Budget</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pro Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">Plan ahead</p>
                    <p className="text-blue-700">Book your trips 2-3 weeks in advance for better deals</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900">Stay flexible</p>
                    <p className="text-purple-700">Consider alternative dates for potential savings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
