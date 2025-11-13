import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, Copy, Check, Loader2, Lock } from "lucide-react";
import { getEvent, getPeople, type EventResponse, type PersonResponse } from "../config/api";
import { calculateTable, calculateAvailability, expandTimes, type Person } from "../utils";
import { AvailabilityGridScreen } from "./AvailabilityGridScreen";
import { useAuthStore } from "../stores/authStore";
import { useMsal } from "@azure/msal-react";
import { LoginRequest } from "@azure/msal-browser";
import OutlookIcon from "./OutlookIcon";

export function EventViewScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { instance } = useMsal();
  const { account, setAccount, setAccessToken, isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [people, setPeople] = useState<PersonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = navigator.language || 'en-US';

  // Convert event times to dates for the grid (must be before early returns)
  const expandedTimes = useMemo(() => {
    if (!event?.times) return [];
    return expandTimes(event.times);
  }, [event?.times]);
  
  // Calculate dates and time range from event times (must be before early returns)
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

  // Convert PersonResponse to Person format (must be before early returns)
  const peopleForCalculation: Person[] = useMemo(() => 
    people.map(p => ({ name: p.name, availability: p.availability })),
    [people]
  );

  // Fetch event data (even if not authenticated, so we can show event name in login prompt)
  useEffect(() => {
    if (!eventId) {
      setError("Event ID is required");
      setIsLoading(false);
      return;
    }

    const fetchEventData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching event:', eventId);
        
        // Fetch event data (this can be done without auth)
        const eventData = await getEvent(eventId);
        
        console.log('Event data received:', eventData);
        setEvent(eventData);
        
        // Only fetch people data if authenticated
        if (isAuthenticated()) {
          try {
            const peopleData = await getPeople(eventId);
            setPeople(peopleData);
          } catch (err) {
            console.warn('Failed to fetch people data:', err);
            setPeople([]);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch event:", err);
        console.error("Error details:", {
          status: err?.status,
          statusText: err?.statusText,
          message: err?.message,
          eventId: eventId,
        });
        
        // Provide more specific error messages
        if (err?.status === 404) {
          setError(`Event "${eventId}" not found. The event may have been deleted, the link is incorrect, or it was never created. Please check the event ID and try creating a new event.`);
        } else if (err?.status === 0 || err?.message?.includes('fetch')) {
          setError("Network error: Could not connect to the API. Please check your connection.");
        } else {
          setError(`Failed to load event: ${err?.message || err?.statusText || 'Unknown error'}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Fetch people data when user becomes authenticated
  useEffect(() => {
    if (!eventId || !isAuthenticated()) {
      setPeople([]);
      return;
    }

    // Immediately fetch people data when authenticated
    const fetchPeopleData = async () => {
      try {
        const peopleData = await getPeople(eventId);
        setPeople(peopleData);
      } catch (err) {
        console.warn('Failed to fetch people data:', err);
        setPeople([]);
      }
    };

    fetchPeopleData();

    // Poll for updates every 5 seconds
    const interval = setInterval(async () => {
      try {
        const [eventData, peopleData] = await Promise.all([
          getEvent(eventId),
          getPeople(eventId).catch(() => []),
        ]);
        setEvent(eventData);
        setPeople(peopleData);
      } catch (err) {
        console.error('Failed to refresh event data:', err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [eventId, account]); // Re-run when account changes (login/logout)

  const handleCopyLink = () => {
    if (event) {
      navigator.clipboard.writeText(`${window.location.origin}/${event.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;
      
      const loginRequest: LoginRequest = {
        scopes: ['User.Read', 'email', 'profile'],
        redirectUri: redirectUri,
      };

      const response = await instance.loginPopup(loginRequest);
      
      if (response.account) {
        setAccount(response.account);
        
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            scopes: loginRequest.scopes,
            account: response.account,
          });
          
          setAccessToken(tokenResponse.accessToken);
        } catch (tokenError: any) {
          console.error("Token acquisition error:", tokenError);
          setLoginError(`Failed to get access token: ${tokenError.message || 'Unknown error'}`);
        }
      } else {
        setLoginError('No account returned from login');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.errorCode === 'user_cancelled') {
        setLoginError('Sign-in was cancelled. Please try again.');
      } else if (error.errorCode === 'popup_window_error') {
        setLoginError('Popup was blocked. Please allow popups for this site and try again.');
      } else {
        setLoginError(`Sign-in failed: ${error.message || error.errorCode || 'Unknown error'}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Check authentication - show login prompt if not authenticated
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100">
        <div className="backdrop-blur-2xl bg-white/15 border border-white/20 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/50 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 mb-2">Sign in Required</h2>
              <p className="text-gray-600">
                You need to sign in with your Outlook account to view and respond to this event.
              </p>
            </div>
            {event && (
              <div className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Event:</p>
                <p className="text-gray-900 font-medium">{event.name}</p>
              </div>
            )}
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <OutlookIcon className="w-5 h-5 mr-2" />
                  <span>Sign in with Outlook</span>
                </>
              )}
            </Button>
            {loginError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-700">
                {loginError}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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

