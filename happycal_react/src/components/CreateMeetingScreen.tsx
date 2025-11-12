import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Copy, Check, ExternalLink, Link2, Users, Loader2 } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { createEvent } from "../config/api";
import { generateTimeSlots } from "../utils/generateTimeSlots";
import { useEventsStore } from "../stores/eventsStore";

interface CreateMeetingScreenProps {
  groupName: string;
  onBack: () => void;
  onCreateMeeting: (data: {
    title: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    startTime: string;
    endTime: string;
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

export function CreateMeetingScreen({ groupName, onBack, onCreateMeeting }: CreateMeetingScreenProps) {
  const navigate = useNavigate();
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
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleGenerate = async () => {
    if (!title || dates.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate time slots in the format expected by the API (HHmm-DDMMYYYY)
      const timeSlots = generateTimeSlots(dates, earliestTime, latestTime, timezone);
      
      if (timeSlots.length === 0) {
        setError("No time slots generated. Please check your date and time selections.");
        setIsLoading(false);
        return;
      }

      // Create event via API
      const event = await createEvent({
        name: title,
        times: timeSlots,
        timezone,
      });

      // Store the event in local storage
      addEvent({
        id: event.id,
        name: event.name,
        created_at: event.created_at,
        times: event.times,
        timezone: event.timezone,
      });

      // Generate the shareable link using the event ID from the API
      const link = `${window.location.origin}/${event.id}`;
      setGeneratedLink(link);
      setCreatedEventId(event.id);
      setStep("link");
    } catch (err) {
      console.error("Failed to create event:", err);
      setError("Failed to create event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
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
            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">JD</AvatarFallback>
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
                  <p className="text-gray-600">Set up a scheduling poll for {groupName}</p>
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
                      placeholder="e.g., Midterm Study Session"
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

                  {/* Time Range */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Time Range (each day)
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Earliest</Label>
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
                        <Label className="text-sm text-gray-600">Latest</Label>
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
                      className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
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
                      onClick={handleGenerate}
                      disabled={!title || dates.length === 0 || isLoading}
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
                    Share this link with {groupName} members to collect their availability
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
                    <p className="text-sm text-gray-600 mb-1">Time Window</p>
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
                  <Label className="text-gray-700">Shareable Link</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 backdrop-blur-sm bg-white/30 border border-white/40 rounded-lg text-gray-800 text-sm break-all">
                      {generatedLink}
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      className="backdrop-blur-sm bg-white/40 hover:bg-white/60 border border-white/50 text-gray-900 shrink-0"
                      variant="outline"
                    >
                      {linkCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: linkCopied ? 1 : 0 }}
                    className="text-sm text-green-600 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Link copied to clipboard!
                  </motion.p>
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
                      if (createdEventId) {
                        // Navigate to the event page
                        navigate(`/${createdEventId}`);
                      } else {
                        // Fallback to old behavior
                        const startDate = dates[0];
                        const endDate = dates[dates.length - 1];
                        onCreateMeeting({
                          title,
                          startDate,
                          endDate,
                          startTime: earliestTime,
                          endTime: latestTime,
                          dates: dates,
                        });
                      }
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
