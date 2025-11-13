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
  const [eventType, setEventType] = useState<"specific" | "recurring">("specific");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"weekly" | "biweekly">("weekly");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleGenerate = async () => {
    if (!title) return;
    if (eventType === "specific" && dates.length === 0) return;
    if (eventType === "recurring" && selectedWeekdays.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let timeSlots: string[] = [];
      
      if (eventType === "specific") {
        // Generate time slots for specific dates
        timeSlots = generateTimeSlots(dates, earliestTime, latestTime, timezone);
      } else {
        // Generate time slots for recurring weekdays
        const parseTime = (timeStr: string): { hour: number; minute: number } => {
          const [time, period] = timeStr.split(' ');
          const [hour, minute] = time.split(':').map(Number);
          let hour24 = hour;
          if (period === 'PM' && hour !== 12) hour24 += 12;
          if (period === 'AM' && hour === 12) hour24 = 0;
          return { hour: hour24, minute: minute || 0 };
        };

        const start = parseTime(earliestTime);
        const end = parseTime(latestTime);
        const { Temporal } = await import('@js-temporal/polyfill');
        const { serializeTime } = await import('../utils/serializeTime');

        // Generate slots for selected weekdays
        // For biweekly, we need to track which week we're on
        selectedWeekdays.forEach(dayOfWeek => {
          let currentHour = start.hour;
          while (currentHour < end.hour || (currentHour === end.hour && start.minute === 0)) {
            // For recurring events, we use the weekday format (HHmm-d)
            // The API will handle showing the correct dates based on current week
            // For biweekly, we could add a marker, but the API format doesn't support it directly
            // So we'll generate for both weeks if biweekly, or just current week if weekly
            
            if (recurrenceFrequency === "weekly") {
              // Generate for current week only (standard recurring)
              const today = Temporal.Now.plainDateISO();
              const dayDelta = dayOfWeek - today.dayOfWeek;
              const targetDate = today.add({ days: dayDelta });
              
              const zonedDateTime = targetDate
                .toZonedDateTime({ timeZone: timezone, plainTime: Temporal.PlainTime.from({ hour: currentHour, minute: 0 }) })
                .withTimeZone('UTC');

              // Format as HHmm-d (weekday format for recurring)
              const serialized = serializeTime(zonedDateTime, false);
              if (!timeSlots.includes(serialized)) {
                timeSlots.push(serialized);
              }
            } else {
              // Biweekly: generate specific dates for the next 12 weeks (6 occurrences)
              // Since the API doesn't support biweekly in weekday format, we use specific dates
              const today = Temporal.Now.plainDateISO();
              const dayDelta = dayOfWeek - today.dayOfWeek;
              
              // Generate dates for alternating weeks (biweekly pattern)
              for (let weekOffset = 0; weekOffset < 12; weekOffset += 2) {
                const targetDate = today.add({ days: dayDelta + weekOffset });
                const zonedDateTime = targetDate
                  .toZonedDateTime({ timeZone: timezone, plainTime: Temporal.PlainTime.from({ hour: currentHour, minute: 0 }) })
                  .withTimeZone('UTC');
                
                // Format as HHmm-DDMMYYYY (specific date format for biweekly)
                const serialized = serializeTime(zonedDateTime, true);
                if (!timeSlots.includes(serialized)) {
                  timeSlots.push(serialized);
                }
              }
            }
            
            currentHour++;
            
            if (currentHour > end.hour || (currentHour === end.hour && end.minute === 0)) {
              break;
            }
          }
        });
      }
      
      if (timeSlots.length === 0) {
        setError("No time slots generated. Please check your selections.");
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

                  {/* Event Type Selection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-3"
                  >
                    <Label className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-600" />
                      Event Type
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEventType("specific");
                          setSelectedWeekdays([]);
                        }}
                        className={`px-4 py-3 rounded-lg border transition-all ${
                          eventType === "specific"
                            ? "bg-sky-500/20 border-sky-500/50 text-gray-900"
                            : "bg-white/20 border-white/30 text-gray-700 hover:bg-white/30"
                        }`}
                      >
                        <div className="text-sm font-medium">Specific Dates</div>
                        <div className="text-xs text-gray-600 mt-1">Choose exact dates</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEventType("recurring");
                          setDates([]);
                        }}
                        className={`px-4 py-3 rounded-lg border transition-all ${
                          eventType === "recurring"
                            ? "bg-sky-500/20 border-sky-500/50 text-gray-900"
                            : "bg-white/20 border-white/30 text-gray-700 hover:bg-white/30"
                        }`}
                      >
                        <div className="text-sm font-medium">Recurring</div>
                        <div className="text-xs text-gray-600 mt-1">Weekly or biweekly</div>
                      </button>
                    </div>
                  </motion.div>

                  {/* Date Selection - Specific Dates */}
                  {eventType === "specific" && (
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
                  )}

                  {/* Recurring Weekdays Selection */}
                  {eventType === "recurring" && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-600" />
                          Days of Week
                        </Label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRecurrenceFrequency("weekly")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              recurrenceFrequency === "weekly"
                                ? "bg-sky-500/30 text-sky-900 border border-sky-500/50"
                                : "bg-white/20 text-gray-700 border border-white/30 hover:bg-white/30"
                            }`}
                          >
                            Weekly
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecurrenceFrequency("biweekly")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              recurrenceFrequency === "biweekly"
                                ? "bg-sky-500/30 text-sky-900 border border-sky-500/50"
                                : "bg-white/20 text-gray-700 border border-white/30 hover:bg-white/30"
                            }`}
                          >
                            Biweekly
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => {
                          const dayOfWeek = index === 0 ? 0 : index; // Sunday is 0
                          const isSelected = selectedWeekdays.includes(dayOfWeek);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedWeekdays(selectedWeekdays.filter(d => d !== dayOfWeek));
                                } else {
                                  setSelectedWeekdays([...selectedWeekdays, dayOfWeek].sort());
                                }
                              }}
                              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? "bg-sky-500/30 text-sky-900 border-2 border-sky-500/50"
                                  : "bg-white/20 text-gray-700 border border-white/30 hover:bg-white/30"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      {selectedWeekdays.length > 0 && (
                        <p className="text-xs text-gray-600">
                          Selected: {selectedWeekdays.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")} ({recurrenceFrequency})
                        </p>
                      )}
                    </motion.div>
                  )}

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
                      disabled={
                        !title || 
                        isLoading ||
                        (eventType === "specific" && dates.length === 0) ||
                        (eventType === "recurring" && selectedWeekdays.length === 0)
                      }
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
                    <p className="text-gray-900 font-medium">{title}</p>
                  </div>
                  {eventType === "specific" && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Selected Dates</p>
                      <div className="flex flex-wrap gap-2">
                        {dates.map((date) => (
                          <span
                            key={date.toISOString()}
                            className="px-3 py-1.5 backdrop-blur-sm bg-sky-500/20 border border-sky-500/30 rounded-lg text-sm text-gray-800 font-medium"
                          >
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {eventType === "recurring" && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Recurring Pattern</p>
                      <div className="space-y-2">
                        <p className="text-gray-900 font-medium">
                          {selectedWeekdays.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {recurrenceFrequency === "weekly" ? "Every week" : "Every other week"}
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Availability Window</p>
                    <p className="text-gray-900 font-medium">{earliestTime} - {latestTime}</p>
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
                      {generatedLink}
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
