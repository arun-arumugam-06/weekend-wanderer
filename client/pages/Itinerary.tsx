import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Compass, 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation, 
  Calendar,
  Star,
  Car,
  Footprints,
  Bus,
  ArrowLeft,
  Download,
  Share
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Itinerary as ItineraryType, ItineraryItem } from "@shared/api";

export default function Itinerary() {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState<ItineraryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // First check if there's a current itinerary in localStorage
    const currentItinerary = localStorage.getItem("currentItinerary");
    if (currentItinerary) {
      try {
        const parsed = JSON.parse(currentItinerary);
        setItinerary(parsed);
        setLoading(false);
        return;
      } catch (e) {
        console.error("Error parsing current itinerary:", e);
      }
    }

    // If no current itinerary or if we have an ID, fetch from API
    if (id) {
      fetchItinerary(id);
    } else {
      setError("No itinerary found");
      setLoading(false);
    }
  }, [id]);

  const fetchItinerary = async (itineraryId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view itineraries");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/trips/${itineraryId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.itinerary) {
        setItinerary(data.itinerary);
      } else {
        setError(data.message || "Failed to load itinerary");
      }
    } catch (error) {
      console.error("Error fetching itinerary:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'walking': return <Footprints className="w-4 h-4" />;
      case 'driving':
      case 'taxi': return <Car className="w-4 h-4" />;
      case 'auto_rickshaw': return <Car className="w-4 h-4" />;
      case 'public_transport':
      case 'bus':
      case 'metro': return <Bus className="w-4 h-4" />;
      default: return <Navigation className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Weekend Wanderer</h1>
                  <p className="text-xs text-gray-500">Your Trip Itinerary</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <DollarSign className="w-3 h-3 mr-1" />
              ${itinerary.totalCost} total
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Weekend Adventure in {itinerary.location}
          </h1>
          <p className="text-gray-600">
            Your personalized itinerary with {itinerary.items.length} amazing stops
          </p>
        </div>

        {/* Itinerary Timeline */}
        <div className="space-y-6">
          {itinerary.items.map((item: ItineraryItem, index: number) => (
            <div key={item.id} className="relative">
              {/* Timeline Line */}
              {index < itinerary.items.length - 1 && (
                <div className="absolute left-6 top-24 w-0.5 h-16 bg-gray-200"></div>
              )}
              
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Timeline Dot */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {item.attraction.name}
                          </h3>
                          <p className="text-gray-600 mb-2">{item.attraction.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDateTime(item.startTime)} - {formatDateTime(item.endTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {item.attraction.rating}
                            </div>
                            <Badge variant="outline">{item.attraction.category}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">Duration</div>
                          <div className="font-semibold text-gray-900">
                            {formatDuration(item.attraction.estimatedDuration)}
                          </div>
                          {item.attraction.entryFee && item.attraction.entryFee > 0 && (
                            <div className="text-sm text-green-600 font-medium mt-1">
                              ${item.attraction.entryFee} entry
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transport to Next */}
                  {item.transportToNext && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3 text-gray-600">
                          {getTransportIcon(item.transportToNext.type)}
                          <span className="capitalize">
                            {item.transportToNext.type.replace('_', ' ')} to next stop
                          </span>
                          <span>•</span>
                          <span>{formatDuration(item.transportToNext.duration)}</span>
                          <span>•</span>
                          <span>{(item.transportToNext.distance / 1000).toFixed(1)} km</span>
                        </div>
                        {item.transportToNext.cost && item.transportToNext.cost > 0 && (
                          <div className="text-green-600 font-medium">
                            ${item.transportToNext.cost}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Trip Summary */}
        <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Trip Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {itinerary.items.length}
                </div>
                <div className="text-gray-600">Attractions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatDuration(
                    itinerary.items.reduce((total, item) => total + item.attraction.estimatedDuration, 0)
                  )}
                </div>
                <div className="text-gray-600">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  ${itinerary.totalCost}
                </div>
                <div className="text-gray-600">Estimated Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
