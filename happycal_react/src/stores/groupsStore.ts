import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Group {
  id: string;
  name: string;
  created_at: number;
  created_by: string; // User email/username
  memberCount: number;
  members: string[]; // Array of user emails/usernames
  inviteLink: string;
}

interface GroupsState {
  groups: Group[];
  addGroup: (group: Omit<Group, 'id' | 'created_at' | 'inviteLink'>) => Group;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  addMemberToGroup: (groupId: string, memberEmail: string) => void;
  removeMemberFromGroup: (groupId: string, memberEmail: string) => void;
  getGroup: (groupId: string) => Group | undefined;
  deleteGroup: (groupId: string) => void;
}

export const useGroupsStore = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: [],
      addGroup: (groupData) => {
        const id = `${groupData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const created_at = Math.floor(Date.now() / 1000);
        const inviteLink = `${window.location.origin}/group/${id}`;
        
        const newGroup: Group = {
          ...groupData,
          id,
          created_at,
          inviteLink,
        };
        
        set((state) => ({
          groups: [...state.groups, newGroup],
        }));
        
        return newGroup;
      },
      updateGroup: (groupId, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId ? { ...group, ...updates } : group
          ),
        }));
      },
      addMemberToGroup: (groupId, memberEmail) => {
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id === groupId) {
              // Only add if not already a member
              if (!group.members.includes(memberEmail)) {
                return {
                  ...group,
                  members: [...group.members, memberEmail],
                  memberCount: group.memberCount + 1,
                };
              }
            }
            return group;
          }),
        }));
      },
      removeMemberFromGroup: (groupId, memberEmail) => {
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                members: group.members.filter((email) => email !== memberEmail),
                memberCount: Math.max(0, group.memberCount - 1),
              };
            }
            return group;
          }),
        }));
      },
      getGroup: (groupId) => {
        return get().groups.find((group) => group.id === groupId);
      },
      deleteGroup: (groupId) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== groupId),
        }));
      },
    }),
    {
      name: 'happycal-groups-storage',
    }
  )
);

