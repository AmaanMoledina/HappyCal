import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Copy, Check, ExternalLink, Link2, Users, Loader2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { createEvent } from "../config/api";
import { generateTimeSlots } from "../utils/generateTimeSlots";
import { useEventsStore } from "../stores/eventsStore";

interface CreateEventScreenProps {
  onBack: () => void;
  onViewGrid: (data: {
    title: string;
    dates: Date[];
    earliestTime: string;
    latestTime: string;
  }) => void;
}

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const smoothTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

export function CreateEventScreen({ onBack, onViewGrid }: CreateEventScreenProps) {
  console.log('=== CreateEventScreen RENDERED ===');
  const { account } = useAuthStore();
  const addEvent = useEventsStore((state) => state.addEvent);
  const [step, setStep] = useState<"create" | "link">("create");
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<Date[]>([]);
  const [earliestTime, setEarliestTime] = useState("9:00 AM");
  const [latestTime, setLatestTime] = useState("5:00 PM");
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [timezone] = useState("America/New_York"); // Default timezone

  // Get user initials from account
  const userInitials = useMemo(() => {
    if (account?.name) {
      return account.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (account?.username) {
      return account.username[0].toUpperCase();
    }
    return 'U';
  }, [account]);

  const handleGenerate = async () => {
    console.log('=== handleGenerate CALLED (CreateEventScreen) ===');
    console.log('handleGenerate called', { title, dates: dates.length });
    
    if (!title) {
      console.log('No title, returning early');
      return;
    }
    if (dates.length === 0) {
      console.log('No dates selected, returning early');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Generating time slots for specific dates', { dates, earliestTime, latestTime, timezone });
      const timeSlots = generateTimeSlots(dates, earliestTime, latestTime, timezone);
      console.log('Generated time slots:', timeSlots);
      
      if (timeSlots.length === 0) {
        console.error("No time slots generated");
        setError("No time slots generated. Please check your selections.");
        setIsLoading(false);
        return;
      }

      console.log('About to create event via API', { name: title, timesCount: timeSlots.length, timezone });
      
      const event = await createEvent({
        name: title,
        times: timeSlots,
        timezone,
      });
      
      console.log('Event created successfully:', event);

      // Store the event in local storage
      addEvent({
        id: event.id,
        name: event.name,
        created_at: event.created_at,
        times: event.times,
        timezone: event.timezone,
      });

      // Generate the shareable link using the event ID from the API
      if (!event.id) {
        console.error("Event created but no ID returned:", event);
        setError("Event created but no ID returned. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Use current origin (localhost in dev, production domain in prod)
      const origin = window.location.origin;
      const link = `${origin}/${event.id}`;
      console.log('Generated link:', link, 'Event ID:', event.id, 'Origin:', origin);
      setGeneratedLink(link);
      setCreatedEventId(event.id);
      setStep("link");
    } catch (err: any) {
      console.error("Failed to create event:", err);
      console.error("Error details:", {
        message: err?.message,
        status: err?.status,
        statusText: err?.statusText,
        stack: err?.stack,
      });
      setError(`Failed to create event: ${err?.message || err?.statusText || 'Unknown error'}. Check console for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const linkToCopy = generatedLink || (createdEventId ? `${window.location.origin}/${createdEventId}` : window.location.origin);
    await navigator.clipboard.writeText(linkToCopy);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = date.toDateString();
    const existingIndex = dates.findIndex(d => d.toDateString() === dateString);
    
    if (existingIndex >= 0) {
      setDates(dates.filter((_, i) => i !== existingIndex));
    } else {
      setDates([...dates, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const timeOptions = [
    "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
    "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM",
  ];

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 backdrop-blur-xl bg-white/20 border-b border-white/30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-700 hover:text-gray-900 hover:bg-white/40 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Avatar className="w-9 h-9 ring-2 ring-white/60 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === "create" && (
            <motion.div
              key="create-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={smoothTransition}
              className="backdrop-blur-2xl bg-white/15 border border-white/20 rounded-2xl p-8 shadow-xl"
            >
              <div className="space-y-8">
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-900 mb-2"
                  >
                    Create New Event
                  </motion.h1>
                  <p className="text-gray-600">Set up a scheduling poll and share with anyone</p>
                </div>

                <div className="space-y-6">
                  {/* Event Name */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="title" className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      Event Name
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Coffee Meetup, Team Meeting, Study Session"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="backdrop-blur-sm bg-white/30 border-white/40 focus:bg-white/50 transition-all"
                    />
                  </motion.div>

                  {/* Date Selection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                  >
                    <Label className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-600" />
                      Possible Dates
                    </Label>
                    <div className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-xl p-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left backdrop-blur-sm bg-white/40 border-white/50 hover:bg-white/60"
                          >
                            {dates.length === 0 
                              ? "Select dates (click to add/remove)" 
                              : `${dates.length} date${dates.length > 1 ? 's' : ''} selected`}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 backdrop-blur-xl bg-white/95 border-white/60 shadow-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={dates[0]}
                            onSelect={handleDateSelect}
                            initialFocus
                            className="rounded-lg"
                          />
                        </PopoverContent>
                      </Popover>
                      
                      {/* Selected Dates */}
                      <AnimatePresence>
                        {dates.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={smoothTransition}
                            className="flex flex-wrap gap-2 mt-3 overflow-hidden"
                          >
                            {dates.map((date, index) => (
                              <motion.div
                                key={date.toISOString()}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleDateSelect(date)}
                                className="px-3 py-1.5 backdrop-blur-sm bg-sky-500/20 border border-sky-500/30 rounded-lg text-sm text-gray-800 cursor-pointer hover:bg-sky-500/30 transition-colors"
                              >
                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Availability Window */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Availability Window
                    </Label>
                    <p className="text-sm text-gray-600">Select the time range when people can indicate their availability</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">From</Label>
                        <select
                          value={earliestTime}
                          onChange={(e) => setEarliestTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg backdrop-blur-sm bg-white/30 border border-white/40 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-gray-900"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">To</Label>
                        <select
                          value={latestTime}
                          onChange={(e) => setLatestTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg backdrop-blur-sm bg-white/30 border border-white/40 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-gray-900"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={(e) => {
                        console.log('=== BUTTON CLICKED (CreateEventScreen) ===', e);
                        console.log('Button state:', { title, isLoading, datesLength: dates.length });
                        handleGenerate();
                      }}
                      disabled={!title || isLoading || dates.length === 0}
                      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Event...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Generate Scheduling Link
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "link" && (
            <motion.div
              key="link-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springTransition}
              className="backdrop-blur-2xl bg-white/15 border border-white/20 rounded-2xl p-8 shadow-xl"
            >
              <div className="space-y-8">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ ...springTransition, delay: 0.1 }}
                  className="flex justify-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30 flex items-center justify-center">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <h2 className="text-gray-900 mb-2">Event Created!</h2>
                  <p className="text-gray-600">
                    Share this link with participants to collect their availability
                  </p>
                </motion.div>

                {/* Event Details */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-xl p-6 space-y-4"
                >
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Event Name</p>
                    <p className="text-gray-900">{title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dates</p>
                    <div className="flex flex-wrap gap-2">
                      {dates.map((date) => (
                        <span
                          key={date.toISOString()}
                          className="px-2 py-1 backdrop-blur-sm bg-sky-500/20 border border-sky-500/30 rounded text-sm text-gray-800"
                        >
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Availability Window</p>
                    <p className="text-gray-900">{earliestTime} - {latestTime}</p>
                  </div>
                </motion.div>

                {/* Shareable Link */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700 font-medium">Shareable Link</Label>
                    <p className="text-xs text-gray-500">Share this link to collect availability</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 backdrop-blur-sm bg-white/40 border border-white/50 rounded-lg text-gray-900 text-sm break-all font-mono">
                      {generatedLink || (createdEventId ? `${window.location.origin}/${createdEventId}` : 'Generating link...')}
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      className="backdrop-blur-sm bg-white/50 hover:bg-white/70 border border-white/60 text-gray-900 shrink-0 shadow-md"
                      variant="outline"
                      size="icon"
                    >
                      {linkCopied ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: linkCopied ? 1 : 0, height: linkCopied ? 'auto' : 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-green-600 flex items-center gap-2 font-medium">
                      <Check className="w-4 h-4" />
                      Link copied to clipboard!
                    </p>
                  </motion.div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3"
                >
                  <Button
                    onClick={() => {
                      onViewGrid({
                        title,
                        dates,
                        earliestTime,
                        latestTime,
                      });
                    }}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Availability Grid
                  </Button>
                  <Button
                    onClick={() => {
                      setStep("create");
                      setTitle("");
                      setDates([]);
                      setGeneratedLink("");
                    }}
                    variant="outline"
                    className="backdrop-blur-sm bg-white/40 hover:bg-white/60 border-white/50"
                  >
                    Create Another
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
