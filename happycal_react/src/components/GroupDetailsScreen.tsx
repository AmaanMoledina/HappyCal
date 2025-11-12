import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

interface Member {
  id: string;
  name: string;
  initials: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
}

interface GroupDetailsScreenProps {
  groupName: string;
  members: Member[];
  meetings: Meeting[];
  onBack: () => void;
  onCreateMeeting: () => void;
  onViewMeeting: (meetingId: string) => void;
}

export function GroupDetailsScreen({
  groupName,
  members,
  meetings,
  onBack,
  onCreateMeeting,
  onViewMeeting,
}: GroupDetailsScreenProps) {
  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 backdrop-blur-xl bg-white/20 border-b border-white/30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-10">
          <div className="backdrop-blur-2xl bg-white/15 border border-white/20 rounded-xl p-8 shadow-xl">
            <h1 className="text-gray-900 mb-6">{groupName}</h1>

            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-4">Group Members</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {members.map((member) => (
                    <Avatar key={member.id} className="w-10 h-10 ring-2 ring-white/60 shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>

              <Button
                onClick={onCreateMeeting}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0"
              >
                Schedule Group Meeting
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-gray-900 mb-4">Upcoming Sessions</h3>
            {meetings.length === 0 ? (
              <p className="text-gray-600">No sessions scheduled yet</p>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <Card
                    key={meeting.id}
                    className="p-4 backdrop-blur-2xl bg-white/15 border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/25 transition-all cursor-pointer"
                    onClick={() => onViewMeeting(meeting.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-gray-900">{meeting.title}</h4>
                        <div className="flex items-center gap-4 text-gray-700 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{meeting.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{meeting.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
