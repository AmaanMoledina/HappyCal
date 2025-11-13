import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";
import { ArrowLeft, Calendar, Clock, Copy, Check, Users, Trash2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useGroupsStore } from "../stores/groupsStore";

interface GroupDetailsScreenProps {
  groupId: string;
  onBack: () => void;
  onCreateMeeting: () => void;
  onViewMeeting: (meetingId: string) => void;
}

export function GroupDetailsScreen({
  groupId,
  onBack,
  onCreateMeeting,
  onViewMeeting,
}: GroupDetailsScreenProps) {
  const { account } = useAuthStore();
  const { getGroup, deleteGroup } = useGroupsStore();
  const [linkCopied, setLinkCopied] = useState(false);
  
  const group = getGroup(groupId);

  const handleDeleteGroup = () => {
    if (group && window.confirm(`Are you sure you want to delete "${group.name}"? This will remove the group and all its members. This action cannot be undone.`)) {
      deleteGroup(groupId);
      onBack();
    }
  };
  
  // Get members from group (for now, we'll show member emails/usernames)
  const members = useMemo(() => {
    if (!group) return [];
    return group.members.map((email, index) => ({
      id: `member-${index}`,
      name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format email as name
      initials: email.substring(0, 2).toUpperCase(),
      email,
    }));
  }, [group]);
  
  // For now, meetings will be empty - we can add meeting tracking later
  const meetings: any[] = [];

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
            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {!group ? (
          <div className="text-center backdrop-blur-2xl bg-white/15 border border-white/20 rounded-xl p-8 shadow-xl">
            <p className="text-gray-700">Group not found</p>
            <Button onClick={onBack} className="mt-4 bg-gradient-to-r from-sky-500 to-blue-600">
              Go Back
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="backdrop-blur-2xl bg-white/15 border border-white/20 rounded-xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-gray-900">{group.name}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteGroup}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50/50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Group
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-900 mb-4">Group Members ({group.memberCount})</h3>
                  {members.length === 0 ? (
                    <p className="text-gray-600">No members yet</p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      {members.map((member) => (
                        <Avatar key={member.id} className="w-10 h-10 ring-2 ring-white/60 shadow-lg" title={member.email}>
                          <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invite Link Section */}
                <div className="space-y-3">
                  <h3 className="text-gray-900 mb-2">Invite Link</h3>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 backdrop-blur-sm bg-white/40 border border-white/50 rounded-lg text-gray-900 text-sm break-all font-mono">
                      {group.inviteLink}
                    </div>
                    <Button
                      onClick={async () => {
                        await navigator.clipboard.writeText(group.inviteLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
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
                  {linkCopied && (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Link copied to clipboard!
                    </p>
                  )}
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
        )}
      </main>
    </div>
  );
}
