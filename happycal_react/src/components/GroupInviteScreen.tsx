import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, Users, Check, Loader2, X } from "lucide-react";
import { useGroupsStore } from "../stores/groupsStore";
import { useAuthStore } from "../stores/authStore";

export function GroupInviteScreen() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { account } = useAuthStore();
  const { getGroup, addMemberToGroup } = useGroupsStore();
  const [group, setGroup] = useState<ReturnType<typeof getGroup>>(undefined);
  const [isJoining, setIsJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      const foundGroup = getGroup(groupId);
      setGroup(foundGroup);
      
      // Check if user is already a member
      if (foundGroup && account?.username) {
        setJoined(foundGroup.members.includes(account.username));
      }
      
      if (!foundGroup) {
        setError("Group not found. The invite link may be invalid or the group may have been deleted.");
      }
    }
  }, [groupId, getGroup, account]);

  const handleJoin = () => {
    if (!groupId || !account?.username || !group) {
      setError("Unable to join group. Please make sure you're signed in.");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      addMemberToGroup(groupId, account.username);
      setJoined(true);
      console.log('Successfully joined group:', groupId);
    } catch (err: any) {
      console.error("Failed to join group:", err);
      setError("Failed to join group. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate("/");
  };

  if (!group && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-500" />
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen">
        <header className="px-6 py-4 backdrop-blur-xl bg-white/20 border-b border-white/30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoToDashboard}
              className="text-gray-700 hover:text-gray-900 hover:bg-white/40 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="text-center backdrop-blur-2xl bg-white/15 border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-gray-700 mb-4">{error || "Group not found"}</p>
            <Button
              onClick={handleGoToDashboard}
              className="bg-gradient-to-r from-sky-500 to-blue-600"
            >
              Go to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 backdrop-blur-xl bg-white/20 border-b border-white/30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoToDashboard}
            className="text-gray-700 hover:text-gray-900 hover:bg-white/40 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-2xl bg-white/15 border border-white/20 rounded-2xl p-8 shadow-xl"
        >
          <div className="space-y-8">
            {/* Group Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/30 flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Group Info */}
            <div className="text-center space-y-2">
              <h2 className="text-gray-900 text-2xl">{group.name}</h2>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
              </div>
            </div>

            {/* Join Status */}
            {joined ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-300">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">You're already a member!</span>
                </div>
                <Button
                  onClick={handleGoToDashboard}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0"
                >
                  Go to Dashboard
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-center text-gray-600">
                  You've been invited to join this group. Click below to become a member.
                </p>
                {error && (
                  <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm text-center">
                    {error}
                  </div>
                )}
                <Button
                  onClick={handleJoin}
                  disabled={isJoining || !account}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Join Group
                    </>
                  )}
                </Button>
                {!account && (
                  <p className="text-sm text-gray-600 text-center">
                    Please sign in to join this group.
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

