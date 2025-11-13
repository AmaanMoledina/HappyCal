import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Users, Calendar, Clock, TrendingUp, Plus, Bell, CalendarDays, Loader2, LogOut } from "lucide-react";
import { useEventsStore } from "../stores/eventsStore";
import { useAuthStore } from "../stores/authStore";
import { getEvent, getPeople, type EventResponse } from "../config/api";

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

interface DashboardScreenProps {
  groups: Group[];
  onGroupClick: (groupId: string) => void;
  onScheduleMeeting: (groupId: string) => void;
  onScheduleEvent: () => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

interface EventWithDetails extends EventResponse {
  peopleCount?: number;
  isLoading?: boolean;
}

export function DashboardScreen({ groups, onGroupClick, onScheduleMeeting, onScheduleEvent }: DashboardScreenProps) {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const { account, clearAuth } = useAuthStore();
  const storedEvents = useEventsStore((state) => state.events);
  const [eventsWithDetails, setEventsWithDetails] = useState<EventWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get user info from account
  const userName = account?.name || account?.username || 'User';
  const userEmail = account?.username || '';
  const userInitials = useMemo(() => {
    if (account?.name) {
      return account.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (userEmail) {
      return userEmail[0].toUpperCase();
    }
    return 'U';
  }, [account, userEmail]);

  const handleSignOut = async () => {
    try {
      await instance.logoutPopup();
      clearAuth();
      // Navigate to login - you might need to update this based on your routing
      window.location.href = '/';
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Fetch details for all stored events
  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsLoading(true);
      const events = await Promise.all(
        storedEvents.map(async (storedEvent) => {
          try {
            const [event, people] = await Promise.all([
              getEvent(storedEvent.id),
              getPeople(storedEvent.id).catch(() => []),
            ]);
            return {
              ...event,
              peopleCount: people.length,
              isLoading: false,
            };
          } catch (err) {
            console.error(`Failed to fetch event ${storedEvent.id}:`, err);
            return {
              ...storedEvent,
              peopleCount: 0,
              isLoading: false,
            };
          }
        })
      );
      setEventsWithDetails(events);
      setIsLoading(false);
    };

    if (storedEvents.length > 0) {
      fetchEventDetails();
      // Refresh every 10 seconds
      const interval = setInterval(fetchEventDetails, 10000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [storedEvents]);

  // Sort events by creation date (newest first)
  const sortedEvents = useMemo(() => {
    return [...eventsWithDetails].sort((a, b) => b.created_at - a.created_at);
  }, [eventsWithDetails]);

  // Get upcoming events (next 2)
  const upcomingEvents = useMemo(() => {
    return sortedEvents.slice(0, 2);
  }, [sortedEvents]);

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 backdrop-blur-xl bg-white/20 border-b border-white/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900">HappyCal</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-600">{userEmail}</p>
              </div>
              <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-white/60 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-700 hover:text-gray-900"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-gray-900">{getGreeting()}, {userName.split(' ')[0]}! 👋</h1>
            <p className="text-gray-600">Manage your university events and stay connected with your groups</p>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5 backdrop-blur-2xl bg-white/15 border border-white/20 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Events</p>
                  <p className="text-gray-900">{sortedEvents.length} total</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 backdrop-blur-2xl bg-white/15 border border-white/20 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Responses</p>
                  <p className="text-gray-900">
                    {sortedEvents.reduce((sum, e) => sum + (e.peopleCount || 0), 0)} people
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 backdrop-blur-2xl bg-white/15 border border-white/20 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Groups</p>
                  <p className="text-gray-900">{groups.length} study teams</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">My Active Events</h2>
            <Button 
              onClick={onScheduleEvent}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Event
            </Button>
          </div>

          {/* Upcoming Events Preview */}
          <Card className="p-6 backdrop-blur-2xl bg-white/15 border border-white/20 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-900">My Active Events</h3>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-600" />}
              </div>
              {isLoading && sortedEvents.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                </div>
              ) : sortedEvents.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No events yet. Create one to get started!</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const createdDate = new Date(event.created_at * 1000);
                    const isRecent = Date.now() - createdDate.getTime() < 24 * 60 * 60 * 1000; // Last 24 hours
                    
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg backdrop-blur-xl bg-white/20 hover:bg-white/30 transition-all cursor-pointer"
                        onClick={() => navigate(`/${event.id}`)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-2 h-2 rounded-full ${isRecent ? 'bg-sky-500' : 'bg-gray-400'}`}></div>
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{event.name}</p>
                            <p className="text-sm text-gray-600">
                              {event.peopleCount || 0} {event.peopleCount === 1 ? 'person' : 'people'} responded
                              {isRecent && ' • Created today'}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          className={`${
                            (event.peopleCount || 0) > 0 
                              ? 'bg-emerald-500/20 text-emerald-700 border-emerald-300/50' 
                              : 'bg-amber-500/20 text-amber-700 border-amber-300/50'
                          }`}
                        >
                          {(event.peopleCount || 0) > 0 ? 'Active' : 'Pending'}
                        </Badge>
                      </div>
                    );
                  })}
                  {sortedEvents.length > 2 && (
                    <Button
                      variant="ghost"
                      className="w-full text-sky-600 hover:text-sky-700 hover:bg-sky-50/50"
                      onClick={() => {
                        // Could navigate to a full events list page
                        console.log('View all events');
                      }}
                    >
                      View all {sortedEvents.length} events
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Groups Grid */}
          <div className="space-y-4">
            <h3 className="text-gray-900">All Study Groups & Clubs</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="p-6 backdrop-blur-2xl bg-white/15 border border-white/20 shadow-lg hover:shadow-2xl hover:bg-white/25 transition-all cursor-pointer group"
                  onClick={() => onGroupClick(group.id)}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-gray-900 mb-2 group-hover:text-sky-700 transition-colors">{group.name}</h3>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{group.memberCount} members</span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleMeeting(group.id);
                      }}
                    >
                      Schedule Group Meeting
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={onScheduleEvent}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-2xl shadow-sky-500/40 flex items-center justify-center transition-transform hover:scale-110"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
