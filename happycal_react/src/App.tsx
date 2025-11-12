import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LoginScreen } from "./components/LoginScreen";
import { DashboardScreen } from "./components/DashboardScreen";
import { GroupDetailsScreen } from "./components/GroupDetailsScreen";
import { CreateMeetingScreen } from "./components/CreateMeetingScreen";
import { CreateEventScreen } from "./components/CreateEventScreen";
import { AvailabilityGridScreen } from "./components/AvailabilityGridScreen";
import { EventViewScreen } from "./components/EventViewScreen";

type Screen = 
  | { type: "login" }
  | { type: "dashboard" }
  | { type: "groupDetails"; groupId: string }
  | { type: "createMeeting"; groupId: string }
  | { type: "createEvent" }
  | { type: "availabilityGrid"; groupId?: string; meetingTitle: string; dates?: Date[]; startTime?: string; endTime?: string };

// Mock data
const mockGroups = [
  { id: "1", name: "FINC-440 Study Group", memberCount: 8 },
  { id: "2", name: "Kellogg Marketing Club", memberCount: 12 },
  { id: "3", name: "KWEST Section 4", memberCount: 6 },
  { id: "4", name: "Tech Club Leadership", memberCount: 5 },
  { id: "5", name: "Consulting Case Prep", memberCount: 15 },
  { id: "6", name: "Social Impact Lab", memberCount: 7 },
];

const mockMembers = [
  { id: "1", name: "John Doe", initials: "JD" },
  { id: "2", name: "Jane Smith", initials: "JS" },
  { id: "3", name: "Mike Johnson", initials: "MJ" },
  { id: "4", name: "Sarah Williams", initials: "SW" },
  { id: "5", name: "Tom Brown", initials: "TB" },
  { id: "6", name: "Emily Davis", initials: "ED" },
  { id: "7", name: "Chris Wilson", initials: "CW" },
  { id: "8", name: "Anna Taylor", initials: "AT" },
];

const mockMeetings = [
  { id: "1", title: "Finance Final Exam Prep", date: "Nov 15, 2025", time: "2:00 PM" },
  { id: "2", title: "Case Competition Debrief", date: "Nov 18, 2025", time: "10:00 AM" },
  { id: "3", title: "KWEST Happy Hour Planning", date: "Nov 22, 2025", time: "3:30 PM" },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>({ type: "login" });
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const handleLogin = () => {
    setCurrentScreen({ type: "dashboard" });
  };

  const handleGroupClick = (groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentScreen({ type: "groupDetails", groupId });
  };

  const handleScheduleMeeting = (groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentScreen({ type: "createMeeting", groupId });
  };

  const handleCreateMeeting = (data: {
    title: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    startTime: string;
    endTime: string;
    dates?: Date[];
  }) => {
    // Generate dates array from startDate to endDate if dates not provided
    let dates: Date[] = [];
    if (data.dates && data.dates.length > 0) {
      dates = data.dates;
    } else if (data.startDate && data.endDate) {
      const current = new Date(data.startDate);
      while (current <= data.endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }
    
    setCurrentScreen({
      type: "availabilityGrid",
      groupId: selectedGroupId,
      meetingTitle: data.title,
      dates,
      startTime: data.startTime,
      endTime: data.endTime,
    });
  };

  const handleBackToDashboard = () => {
    setCurrentScreen({ type: "dashboard" });
  };

  const handleBackToGroupDetails = () => {
    setCurrentScreen({ type: "groupDetails", groupId: selectedGroupId });
  };

  const handleConfirmTime = () => {
    // In a real app, this would save the meeting and show confirmation
    alert("Meeting time confirmed! Your study group will be notified.");
    if (selectedGroupId) {
      setCurrentScreen({ type: "groupDetails", groupId: selectedGroupId });
    } else {
      setCurrentScreen({ type: "dashboard" });
    }
  };

  const handleScheduleEvent = () => {
    setCurrentScreen({ type: "createEvent" });
  };

  const handleViewEventGrid = (data: {
    title: string;
    dates: Date[];
    earliestTime: string;
    latestTime: string;
  }) => {
    setCurrentScreen({
      type: "availabilityGrid",
      meetingTitle: data.title,
      dates: data.dates,
      startTime: data.earliestTime,
      endTime: data.latestTime,
    });
  };

  const getGroupName = (groupId: string) => {
    return mockGroups.find((g) => g.id === groupId)?.name || "";
  };

  const location = useLocation();

  // Check if we're viewing an event (path like /event-id-123456)
  // Event IDs have format: {name}-{number}, so they won't match dashboard/login/etc
  const isEventRoute = location.pathname !== '/' && 
    !location.pathname.startsWith('/dashboard') &&
    !location.pathname.startsWith('/login') &&
    !location.pathname.startsWith('/create') &&
    location.pathname.split('/').length === 2; // Single path segment

  if (isEventRoute) {
    return (
      <Routes>
        <Route path="/:eventId" element={<EventViewScreen />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100">
      {currentScreen.type === "login" && (
        <LoginScreen onLogin={handleLogin} />
      )}

      {currentScreen.type === "dashboard" && (
        <DashboardScreen
          groups={mockGroups}
          onGroupClick={handleGroupClick}
          onScheduleMeeting={handleScheduleMeeting}
          onScheduleEvent={handleScheduleEvent}
        />
      )}

      {currentScreen.type === "groupDetails" && (
        <GroupDetailsScreen
          groupName={getGroupName(currentScreen.groupId)}
          members={mockMembers}
          meetings={mockMeetings}
          onBack={handleBackToDashboard}
          onCreateMeeting={() => handleScheduleMeeting(currentScreen.groupId)}
          onViewMeeting={(meetingId) => {
            // In a real app, this would navigate to a meeting details view
            console.log("View meeting:", meetingId);
          }}
        />
      )}

      {currentScreen.type === "createMeeting" && (
        <CreateMeetingScreen
          groupName={getGroupName(currentScreen.groupId)}
          onBack={handleBackToGroupDetails}
          onCreateMeeting={handleCreateMeeting}
        />
      )}

      {currentScreen.type === "createEvent" && (
        <CreateEventScreen
          onBack={handleBackToDashboard}
          onViewGrid={handleViewEventGrid}
        />
      )}

      {currentScreen.type === "availabilityGrid" && (
        <AvailabilityGridScreen
          meetingTitle={currentScreen.meetingTitle}
          dates={currentScreen.dates}
          startTime={currentScreen.startTime}
          endTime={currentScreen.endTime}
          onBack={currentScreen.groupId ? handleBackToGroupDetails : handleBackToDashboard}
          onConfirmTime={handleConfirmTime}
        />
      )}
    </div>
  );
}
