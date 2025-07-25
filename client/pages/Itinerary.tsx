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
  Share,
  Plus,
  Copy,
  CheckCircle,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Itinerary as ItineraryType, ItineraryItem } from "@shared/api";

export default function Itinerary() {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState<ItineraryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check URL parameters for fresh data flag
    const urlParams = new URLSearchParams(window.location.search);
    const isFreshTrip = urlParams.get("fresh") === "true";

    // First check if there's a current itinerary in localStorage
    const currentItinerary = localStorage.getItem("currentItinerary");
    if (currentItinerary && !id) {
      try {
        const parsed = JSON.parse(currentItinerary);
        console.log(
          "📋 Loading itinerary from localStorage:",
          parsed.location,
          parsed.items.map((i) => i.attraction.name),
        );

        // Check if this is old cached data with US attractions (only clear if NOT a fresh trip)
        const hasUSAttractions = parsed.items.some(
          (item: any) =>
            item.attraction.name.includes("Central Park") ||
            item.attraction.name.includes("Times Square") ||
            item.attraction.name.includes("Metropolitan Museum"),
        );

        if (hasUSAttractions && !isFreshTrip) {
          console.log("🚫 Detected old US cached data, clearing...");
          localStorage.removeItem("currentItinerary");
          setError(
            "Old cached data detected. Please plan a new trip to get fresh Indian attractions.",
          );
          setLoading(false);
          return;
        }

        // Load the itinerary (whether fresh or cached)
        setItinerary(parsed);
        setLoading(false);

        // Clean up URL if it's a fresh trip
        if (isFreshTrip) {
          window.history.replaceState({}, "", "/itinerary");
        }

        return;
      } catch (e) {
        console.error("Error parsing current itinerary:", e);
        localStorage.removeItem("currentItinerary"); // Clear invalid data
      }
    }

    // If no current itinerary or if we have an ID, fetch from API
    if (id) {
      fetchItinerary(id);
    } else {
      setError("No itinerary found. Please plan a trip first.");
      setLoading(false);
    }
  }, [id]);

  const fetchItinerary = async (itineraryId: string) => {
    try {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (!token || !user) {
        setError("Please log in to view itineraries");
        setLoading(false);
        return;
      }

      console.log(`📋 Fetching itinerary ${itineraryId} for user`);
      const response = await fetch(`/api/trips/${itineraryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.itinerary) {
        const currentUser = JSON.parse(user);

        // Verify the itinerary belongs to the current user
        if (data.itinerary.userId !== currentUser.id) {
          setError("You don't have permission to view this itinerary");
          setLoading(false);
          return;
        }

        console.log(`✅ Loaded itinerary: ${data.itinerary.location}`);
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
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
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
      case "walking":
        return <Footprints className="w-4 h-4" />;
      case "driving":
      case "taxi":
        return <Car className="w-4 h-4" />;
      case "auto_rickshaw":
        return <Car className="w-4 h-4" />;
      case "public_transport":
      case "bus":
      case "metro":
        return <Bus className="w-4 h-4" />;
      default:
        return <Navigation className="w-4 h-4" />;
    }
  };

  const handleShare = async () => {
    if (!itinerary) return;

    setIsSharing(true);

    const shareData = {
      title: `Weekend Adventure in ${itinerary.location}`,
      text: `Check out my amazing weekend itinerary for ${itinerary.location}! ${itinerary.items.length} attractions for only ₹${itinerary.totalCost}`,
      url: window.location.href,
    };

    try {
      // Try native Web Share API first (mobile/PWA)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Final fallback: manual copy
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (clipboardError) {
        alert(
          "Unable to share. Please copy the URL manually: " +
            window.location.href,
        );
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!itinerary) return;

    setIsDownloading(true);

    try {
      // Create a temporary container for PDF content
      const element = document.getElementById("itinerary-content");
      if (!element) {
        throw new Error("Itinerary content not found");
      }

      // Hide header and action buttons for PDF
      const header = document.querySelector("header");
      const actionButtons = document.querySelector(".action-buttons");
      const originalHeaderDisplay = header ? header.style.display : "";
      const originalButtonsDisplay = actionButtons
        ? (actionButtons as HTMLElement).style.display
        : "";

      if (header) header.style.display = "none";
      if (actionButtons) (actionButtons as HTMLElement).style.display = "none";

      // Configure html2canvas options
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        height: element.scrollHeight,
        width: element.scrollWidth,
        logging: false,
        allowTaint: true,
      });

      // Restore hidden elements
      if (header) header.style.display = originalHeaderDisplay;
      if (actionButtons)
        (actionButtons as HTMLElement).style.display = originalButtonsDisplay;

      // Create PDF
      const imgData = canvas.toDataURL("image/png", 0.8);
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 190; // A4 width in mm with margins
      const pageHeight = 277; // A4 height in mm with margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 10; // Start with 10mm margin

      // Add title page
      pdf.setFontSize(20);
      pdf.text("Weekend Wanderer", 105, 15, { align: "center" });
      pdf.setFontSize(16);
      pdf.text(`${itinerary.location} Itinerary`, 105, 25, { align: "center" });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 35, {
        align: "center",
      });

      // Add first page content
      pdf.addImage(imgData, "PNG", 10, position + 30, imgWidth, imgHeight);
      heightLeft -= pageHeight - 40;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position + 10, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const fileName = `${itinerary.location.replace(/[^a-zA-Z0-9]/g, "-")}-itinerary-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Unable to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!itinerary) return;

    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to save trips");
        return;
      }

      // Check if this itinerary is already saved (has an ID from server)
      if (itinerary.id.startsWith("itinerary_")) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        return;
      }

      // Save the trip by creating a new itinerary
      const response = await fetch("/api/trips/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: itinerary.startDate,
          endDate: itinerary.endDate,
          location: itinerary.location,
        }),
      });

      const data = await response.json();

      if (data.success && data.itinerary) {
        setIsSaved(true);
        console.log("✅ Trip saved successfully:", data.itinerary.location);

        // Update the current itinerary with the saved version
        setItinerary(data.itinerary);
        localStorage.setItem(
          "currentItinerary",
          JSON.stringify(data.itinerary),
        );

        setTimeout(() => setIsSaved(false), 3000);
      } else {
        throw new Error(data.message || "Failed to save trip");
      }
    } catch (error) {
      console.error("Error saving trip:", error);
      setError("Failed to save trip. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const checkIfTripIsSaved = () => {
    if (!itinerary) return false;
    // Trip is considered saved if it has a proper server-generated ID
    return itinerary.id.startsWith("itinerary_") && itinerary.userId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
          <div className="space-x-3">
            <Link to="/">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Plan New Trip
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      {/* Header */}
      <header className="glass-navbar sticky top-0 z-50 smooth-transition">
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
                <div className="relative w-11 h-11">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg"></div>
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
                  <p className="text-xs text-gray-600">Your Trip Itinerary</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 action-buttons">
              {/* Save Trip Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={checkIfTripIsSaved() ? "default" : "outline"}
                    size="sm"
                    onClick={handleSaveTrip}
                    disabled={isSaving || checkIfTripIsSaved()}
                    className={
                      checkIfTripIsSaved()
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }
                  >
                    {isSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-white" />
                        Saved!
                      </>
                    ) : isSaving ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : checkIfTripIsSaved() ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 mr-2" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save Trip
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {checkIfTripIsSaved()
                      ? "Trip is saved to your collection"
                      : "Save this trip to your collection"}
                  </p>
                </TooltipContent>
              </Tooltip>

              <Link to="/">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Plan New Trip
                </Button>
              </Link>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : isSharing ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share your itinerary with friends</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download PDF of your itinerary</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>

      <div
        id="itinerary-content"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(itinerary.startDate).toLocaleDateString()} -{" "}
              {new Date(itinerary.endDate).toLocaleDateString()}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <DollarSign className="w-3 h-3 mr-1" />₹{itinerary.totalCost}{" "}
              total
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Weekend Adventure in {itinerary.location}
          </h1>
          <p className="text-gray-600">
            Your personalized itinerary with {itinerary.items.length} amazing
            stops
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

              <Card
                className="glass-card border-0 stagger-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Timeline Dot */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {item.attraction.name}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {item.attraction.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDateTime(item.startTime)} -{" "}
                              {formatDateTime(item.endTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {item.attraction.rating}
                            </div>
                            <Badge variant="outline">
                              {item.attraction.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">
                            Duration
                          </div>
                          <div className="font-semibold text-gray-900">
                            {formatDuration(item.attraction.estimatedDuration)}
                          </div>
                          {item.attraction.entryFee &&
                            item.attraction.entryFee > 0 && (
                              <div className="text-sm text-green-600 font-medium mt-1">
                                ₹{item.attraction.entryFee} entry
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
                            {item.transportToNext.type.replace("_", "-")} to
                            next stop
                          </span>
                          <span>•</span>
                          <span>
                            {formatDuration(item.transportToNext.duration)}
                          </span>
                          <span>•</span>
                          <span>
                            {(item.transportToNext.distance / 1000).toFixed(1)}{" "}
                            km
                          </span>
                        </div>
                        {item.transportToNext.cost &&
                          item.transportToNext.cost > 0 && (
                            <div className="text-green-600 font-medium">
                              ₹{item.transportToNext.cost}
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
        <Card className="mt-8 glass-card border-0 stagger-item">
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
                    itinerary.items.reduce(
                      (total, item) =>
                        total + item.attraction.estimatedDuration,
                      0,
                    ),
                  )}
                </div>
                <div className="text-gray-600">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  ₹{itinerary.totalCost}
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
