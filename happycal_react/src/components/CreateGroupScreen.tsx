import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, Users, Copy, Check, Link2, Loader2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useGroupsStore } from "../stores/groupsStore";

interface CreateGroupScreenProps {
  onBack: () => void;
  onGroupCreated?: (groupId: string) => void;
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

export function CreateGroupScreen({ onBack, onGroupCreated }: CreateGroupScreenProps) {
  console.log('=== CreateGroupScreen RENDERED ===');
  const { account } = useAuthStore();
  const addGroup = useGroupsStore((state) => state.addGroup);
  const [step, setStep] = useState<"create" | "link">("create");
  const [groupName, setGroupName] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCreate = () => {
    console.log('=== handleCreate CALLED ===', { groupName });
    
    if (!groupName.trim()) {
      console.log('No group name, returning early');
      return;
    }

    if (!account?.username) {
      console.error('No user account found');
      return;
    }

    setIsLoading(true);

    try {
      // Create the group
      const newGroup = addGroup({
        name: groupName.trim(),
        created_by: account.username,
        memberCount: 1, // Creator is the first member
        members: [account.username],
      });

      console.log('Group created successfully:', newGroup);

      // Generate the shareable link
      const link = newGroup.inviteLink;
      console.log('Generated link:', link, 'Group ID:', newGroup.id);
      setGeneratedLink(link);
      setCreatedGroupId(newGroup.id);
      setStep("link");

      // Call the callback if provided
      if (onGroupCreated) {
        onGroupCreated(newGroup.id);
      }
    } catch (err: any) {
      console.error("Failed to create group:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const linkToCopy = generatedLink || (createdGroupId ? `${window.location.origin}/group/${createdGroupId}` : window.location.origin);
    await navigator.clipboard.writeText(linkToCopy);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

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
                    Create New Group
                  </motion.h1>
                  <p className="text-gray-600">Create a group and invite members to schedule meetings together</p>
                </div>

                <div className="space-y-6">
                  {/* Group Name */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="groupName" className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      Group Name
                    </Label>
                    <Input
                      id="groupName"
                      placeholder="e.g., FINC-440 Study Group, Marketing Club"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && groupName.trim() && !isLoading) {
                          handleCreate();
                        }
                      }}
                      className="backdrop-blur-sm bg-white/30 border-white/40 focus:bg-white/50 transition-all"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      onClick={handleCreate}
                      disabled={!groupName.trim() || isLoading}
                      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Group...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Create Group
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
                  <h2 className="text-gray-900 mb-2">Group Created!</h2>
                  <p className="text-gray-600">
                    Share this link with people to add them to your group
                  </p>
                </motion.div>

                {/* Group Details */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-xl p-6 space-y-4"
                >
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Group Name</p>
                    <p className="text-gray-900">{groupName}</p>
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
                    <Label className="text-gray-700 font-medium">Invite Link</Label>
                    <p className="text-xs text-gray-500">Share this link to add members</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 backdrop-blur-sm bg-white/40 border border-white/50 rounded-lg text-gray-900 text-sm break-all font-mono">
                      {generatedLink || (createdGroupId ? `${window.location.origin}/group/${createdGroupId}` : 'Generating link...')}
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
                    onClick={onBack}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0"
                  >
                    Done
                  </Button>
                  <Button
                    onClick={() => {
                      setStep("create");
                      setGroupName("");
                      setGeneratedLink("");
                      setCreatedGroupId(null);
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

