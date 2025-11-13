import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { calculateTable, calculateAvailability, expandTimes, type Person } from "../utils";
import { generateTimeSlots } from "../utils/generateTimeSlots";
import { useAuthStore } from "../stores/authStore";

interface AvailabilityGridScreenProps {
  meetingTitle: string;
  dates?: Date[];
  startTime?: string;
  endTime?: string;
  eventId?: string;
  people?: Person[];
  expandedTimes?: string[]; // Pre-expanded times from event
  onBack: () => void;
  onConfirmTime: () => void;
}

export function AvailabilityGridScreen({ 
  meetingTitle, 
  dates = [],
  startTime = "9:00 AM",
  endTime = "5:00 PM",
  eventId,
  people: providedPeople,
  expandedTimes: providedExpandedTimes,
  onBack, 
  onConfirmTime 
}: AvailabilityGridScreenProps) {
  const { account } = useAuthStore();
  
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
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");
  const [copied, setCopied] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = navigator.language || 'en-US';

  // Use provided expanded times or generate from dates/time range
  const expandedTimes = useMemo(() => {
    if (providedExpandedTimes && providedExpandedTimes.length > 0) {
      return providedExpandedTimes;
    }
    
    // Generate time slots from dates and time range
    if (dates.length === 0) return [];
    const timeSlots = generateTimeSlots(dates, startTime, endTime, timezone);
    return expandTimes(timeSlots);
  }, [providedExpandedTimes, dates, startTime, endTime, timezone]);

  // Calculate table structure
  const table = useMemo(() => {
    if (expandedTimes.length === 0) return null;
    return calculateTable({
      times: expandedTimes,
      locale,
      timeFormat: '12h',
      timezone,
    });
  }, [expandedTimes, locale, timezone]);

  // Use provided people data only (no mock data)
  const people: Person[] = useMemo(() => {
    if (providedPeople && providedPeople.length > 0) {
      return providedPeople;
    }
    
    // Return empty array if no real data provided (no mock data)
    return [];
  }, [providedPeople]);

  // Calculate group availability
  const { availabilities, min, max } = useMemo(() => {
    if (expandedTimes.length === 0) return { availabilities: [], min: 0, max: 0 };
    return calculateAvailability(expandedTimes, people);
  }, [expandedTimes, people]);

  // Get availability count for a specific slot
  const getAvailabilityCount = (serialized: string): number => {
    const availability = availabilities.find(a => a.date === serialized);
    return availability?.people.length || 0;
  };

  // Get people available at a specific slot
  const getAvailablePeople = (serialized: string): string[] => {
    const availability = availabilities.find(a => a.date === serialized);
    return availability?.people || [];
  };

  // Get initials from a name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get heatmap color based on availability count
  const getHeatmapColor = (count: number, isSelected: boolean): string => {
    if (isSelected) return "rgb(14, 165, 233)"; // Sky-500
    
    if (max === min) return "rgba(14, 165, 233, 0.1)";
    
    const opacity = 0.1 + ((count - min) / (max - min)) * 0.4;
    return `rgba(14, 165, 233, ${opacity})`;
  };

  const handlePointerDown = (e: React.PointerEvent, x: number, y: number, serialized: string) => {
    e.preventDefault();
    setStartPos({ x, y });
    const isSelected = selectedSlots.has(serialized);
    setDragMode(isSelected ? "remove" : "add");
    setIsDragging(true);
    
    const newSelected = new Set(selectedSlots);
    if (isSelected) {
      newSelected.delete(serialized);
    } else {
      newSelected.add(serialized);
    }
    setSelectedSlots(newSelected);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePointerEnter = (x: number, y: number) => {
    if (!isDragging || !startPos || !table) return;
    
    const newSelected = new Set(selectedSlots);
    
    // Select all cells in the rectangle from startPos to current position
    const minX = Math.min(startPos.x, x);
    const maxX = Math.max(startPos.x, x);
    const minY = Math.min(startPos.y, y);
    const maxY = Math.max(startPos.y, y);
    
    table.columns.forEach((column, colIdx) => {
      if (!column || colIdx < minX || colIdx > maxX) return;
      column.cells.forEach((cell, rowIdx) => {
        if (!cell || rowIdx < minY || rowIdx > maxY) return;
        if (dragMode === "add") {
          newSelected.add(cell.serialized);
        } else {
          newSelected.delete(cell.serialized);
        }
      });
    });
    
    setSelectedSlots(newSelected);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setStartPos(null);
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setIsDragging(false);
      setStartPos(null);
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, []);

  const handleCopyLink = () => {
    const link = eventId 
      ? `${window.location.origin}/${eventId}`
      : window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!table || dates.length === 0) {
    return (
      <div className="min-h-screen">
        <header className="px-6 py-4 backdrop-blur-xl bg-white/20 border-b border-white/30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-700 hover:text-gray-900 hover:bg-white/40 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center backdrop-blur-2xl bg-white/15 border border-white/20 rounded-xl p-6 shadow-xl">
            <p className="text-gray-700">No dates selected. Please go back and select dates for the meeting.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 backdrop-blur-xl bg-white/20 border-b border-white/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-3 backdrop-blur-2xl bg-white/15 border border-white/20 rounded-xl p-6 shadow-xl">
            <h1 className="text-gray-900">Find the Best Time</h1>
            <p className="text-gray-700">{meetingTitle}</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-gray-600 text-sm">Share this link with your study group to collect availability</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="text-sky-700 hover:text-sky-800 hover:bg-white/40"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 backdrop-blur-sm bg-white/20 px-4 py-2 rounded-lg border border-white/30">
                Click and drag to mark your availability. Darker blue shows where more people are available.
              </p>
            </div>

            <div
              ref={gridRef}
              className="overflow-x-auto backdrop-blur-2xl bg-white/15 border border-white/20 rounded-xl p-4 shadow-xl"
              onPointerLeave={handlePointerUp}
            >
              <div className="inline-block min-w-full">
                <div 
                  className="grid gap-px bg-white/10 border border-white/20 rounded-lg overflow-hidden shadow-inner"
                  style={{
                    gridTemplateColumns: `80px repeat(${table.columns.filter(c => c !== null).length}, minmax(80px, 1fr))`,
                  }}
                >
                  {/* Time labels column */}
                  <div className="backdrop-blur-sm bg-white/30"></div>
                  
                  {/* Column headers */}
                  {table.columns.map((column, colIdx) => 
                    column ? (
                      <div
                        key={colIdx}
                        className="backdrop-blur-sm bg-white/30 p-3 text-center text-gray-800"
                      >
                        {column.header.dateLabel && (
                          <div className="text-xs text-gray-600">{column.header.dateLabel}</div>
                        )}
                        <div className="font-medium">{column.header.weekdayLabel}</div>
                      </div>
                    ) : (
                      <div key={colIdx} className="backdrop-blur-sm bg-white/30"></div>
                    )
                  )}

                  {/* Rows */}
                  {table.rows.map((row, rowIdx) => {
                    if (!row) {
                      // Spacer row
                      return (
                        <>
                          <div key={`spacer-time-${rowIdx}`} className="backdrop-blur-sm bg-white/30"></div>
                          {table.columns.map((_, colIdx) => (
                            <div key={`spacer-${rowIdx}-${colIdx}`} className="backdrop-blur-sm bg-white/30"></div>
                          ))}
                        </>
                      );
                    }

                    return (
                      <>
                        <div
                          key={`time-${rowIdx}`}
                          className="backdrop-blur-sm bg-white/30 p-3 text-right text-sm text-gray-700"
                        >
                          {row.label}
                        </div>
                        {table.columns.map((column, colIdx) => {
                          if (!column) {
                            return <div key={`spacer-${rowIdx}-${colIdx}`} className="backdrop-blur-sm bg-white/30"></div>;
                          }

                          const cell = column.cells[rowIdx];
                          if (!cell) {
                            return (
                              <div
                                key={`cell-${rowIdx}-${colIdx}`}
                                className="backdrop-blur-sm bg-gray-200/30"
                                style={{ minHeight: "48px" }}
                              />
                            );
                          }

                          const isSelected = selectedSlots.has(cell.serialized);
                          const availabilityCount = getAvailabilityCount(cell.serialized);
                          const availablePeople = getAvailablePeople(cell.serialized);
                          const backgroundColor = getHeatmapColor(availabilityCount, isSelected);

                          return (
                            <div
                              key={`cell-${rowIdx}-${colIdx}`}
                              className="backdrop-blur-sm relative cursor-pointer select-none transition-all hover:scale-[1.02]"
                              style={{
                                minHeight: "48px",
                                backgroundColor,
                                borderTopColor: cell.minute !== 0 && cell.minute !== 30 ? 'transparent' : undefined,
                                borderTopStyle: cell.minute === 30 ? 'dotted' : undefined,
                              }}
                              onPointerDown={(e) => handlePointerDown(e, colIdx, rowIdx, cell.serialized)}
                              onPointerEnter={() => handlePointerEnter(colIdx, rowIdx)}
                              onPointerUp={handlePointerUp}
                              title={`${cell.label}${availablePeople.length > 0 ? ` - ${availablePeople.join(', ')}` : ''}`}
                            >
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>
                                </div>
                              )}
                              {!isSelected && availablePeople.length > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center gap-0.5 p-1 flex-wrap">
                                  {availablePeople.slice(0, 4).map((person, idx) => (
                                    <div
                                      key={idx}
                                      className="text-[10px] font-semibold text-sky-700 bg-white/80 rounded px-1 py-0.5 shadow-sm"
                                      title={person}
                                    >
                                      {getInitials(person)}
                                    </div>
                                  ))}
                                  {availablePeople.length > 4 && (
                                    <div className="text-[10px] font-semibold text-sky-700 bg-white/80 rounded px-1 py-0.5 shadow-sm">
                                      +{availablePeople.length - 4}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={onConfirmTime}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0 px-8"
              >
                Confirm Group Meeting Time
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
