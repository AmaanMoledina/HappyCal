import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react";
import { getEvent, getPeople, type EventResponse, type PersonResponse } from "../config/api";
import { calculateTable, calculateAvailability, expandTimes, type Person } from "../utils";
import { AvailabilityGridScreen } from "./AvailabilityGridScreen";

export function EventViewScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [people, setPeople] = useState<PersonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = navigator.language || 'en-US';

  // Fetch event data
  useEffect(() => {
    if (!eventId) {
      setError("Event ID is required");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch event and people data in parallel
        const [eventData, peopleData] = await Promise.all([
          getEvent(eventId),
          getPeople(eventId).catch(() => []), // People might not exist yet
        ]);

        setEvent(eventData);
        setPeople(peopleData);
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setError("Event not found or failed to load");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  const handleCopyLink = () => {
    if (event) {
      navigator.clipboard.writeText(`${window.location.origin}/${event.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-500" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen">
        <header className="px-6 py-4 backdrop-blur-xl bg-white/20 border-b border-white/30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-gray-700 hover:text-gray-900 hover:bg-white/40 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center backdrop-blur-2xl bg-white/15 border border-white/20 rounded-xl p-6 shadow-xl">
            <p className="text-gray-700">{error || "Event not found"}</p>
            <Button
              onClick={() => navigate("/")}
              className="mt-4 bg-gradient-to-r from-sky-500 to-blue-600"
            >
              Go to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Convert event times to dates for the grid
  const expandedTimes = useMemo(() => expandTimes(event.times), [event.times]);
  
  // Calculate dates and time range from event times
  const { dates, startTime, endTime } = useMemo(() => {
    if (expandedTimes.length === 0) return { dates: [], startTime: "9:00 AM", endTime: "5:00 PM" };
    
    // Extract unique dates and time range from time slots
    const dateSet = new Set<string>();
    const hours: number[] = [];
    
    expandedTimes.forEach(time => {
      if (time.length === 13) { // HHmm-DDMMYYYY format
        const dateStr = time.substring(5);
        const day = dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const year = dateStr.substring(4);
        dateSet.add(`${year}-${month}-${day}`);
        
        // Extract hour
        const hour = parseInt(time.substring(0, 2));
        hours.push(hour);
      }
    });
    
    const dates = Array.from(dateSet).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }).sort((a, b) => a.getTime() - b.getTime());
    
    // Calculate time range
    const minHour = Math.min(...hours);
    const maxHour = Math.max(...hours);
    
    const formatTime = (hour: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${hour12}:00 ${period}`;
    };
    
    return {
      dates,
      startTime: formatTime(minHour),
      endTime: formatTime(maxHour + 1), // Add 1 hour for end time
    };
  }, [expandedTimes]);

  // Convert PersonResponse to Person format
  const peopleForCalculation: Person[] = useMemo(() => 
    people.map(p => ({ name: p.name, availability: p.availability })),
    [people]
  );

  return (
    <AvailabilityGridScreen
      meetingTitle={event.name}
      dates={dates}
      startTime={startTime}
      endTime={endTime}
      eventId={event.id}
      people={peopleForCalculation}
      expandedTimes={expandedTimes}
      onBack={() => navigate("/")}
      onConfirmTime={() => {
        alert("Meeting time confirmed!");
        navigate("/");
      }}
    />
  );
}

