import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LoginScreen } from "./components/LoginScreen";
import { DashboardScreen } from "./components/DashboardScreen";
import { GroupDetailsScreen } from "./components/GroupDetailsScreen";
import { CreateMeetingScreen } from "./components/CreateMeetingScreen";
import { CreateEventScreen } from "./components/CreateEventScreen";
import { CreateGroupScreen } from "./components/CreateGroupScreen";
import { AvailabilityGridScreen } from "./components/AvailabilityGridScreen";
import { EventViewScreen } from "./components/EventViewScreen";
import { GroupInviteScreen } from "./components/GroupInviteScreen";
import { useGroupsStore } from "./stores/groupsStore";

type Screen = 
  | { type: "login" }
  | { type: "dashboard" }
  | { type: "groupDetails"; groupId: string }
  | { type: "createMeeting"; groupId: string }
  | { type: "createEvent" }
  | { type: "createGroup" }
  | { type: "availabilityGrid"; groupId?: string; meetingTitle: string; dates?: Date[]; startTime?: string; endTime?: string };


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

  const handleCreateGroup = () => {
    setCurrentScreen({ type: "createGroup" });
  };

  const handleGroupCreated = (groupId: string) => {
    // After creating a group, go back to dashboard
    setCurrentScreen({ type: "dashboard" });
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

  const { getGroup } = useGroupsStore();

  const getGroupName = (groupId: string) => {
    return getGroup(groupId)?.name || "";
  };

  const location = useLocation();

  // Check if we're viewing an event (path like /event-id-123456)
  // Event IDs have format: {name}-{number}, so they won't match dashboard/login/etc
  const isEventRoute = location.pathname !== '/' && 
    !location.pathname.startsWith('/dashboard') &&
    !location.pathname.startsWith('/login') &&
    !location.pathname.startsWith('/create') &&
    !location.pathname.startsWith('/group/') &&
    location.pathname.split('/').length === 2; // Single path segment

  // Check if we're viewing a group invite
  const isGroupInviteRoute = location.pathname.startsWith('/group/');

  if (isEventRoute) {
    return (
      <Routes>
        <Route path="/:eventId" element={<EventViewScreen />} />
      </Routes>
    );
  }

  if (isGroupInviteRoute) {
    return (
      <Routes>
        <Route path="/group/:groupId" element={<GroupInviteScreen />} />
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
          onGroupClick={handleGroupClick}
          onScheduleMeeting={handleScheduleMeeting}
          onScheduleEvent={handleScheduleEvent}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {currentScreen.type === "createGroup" && (
        <CreateGroupScreen
          onBack={handleBackToDashboard}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {currentScreen.type === "groupDetails" && (
        <GroupDetailsScreen
          groupId={currentScreen.groupId}
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
