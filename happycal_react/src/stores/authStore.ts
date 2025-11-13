import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AccountInfo } from '@azure/msal-browser';

interface AuthStore {
  account: AccountInfo | null;
  accessToken: string | null;
  setAccount: (account: AccountInfo | null) => void;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      account: null,
      accessToken: null,
      setAccount: (account) => set({ account }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () => set({ account: null, accessToken: null }),
      isAuthenticated: () => {
        const state = get();
        return state.account !== null && state.accessToken !== null;
      },
    }),
    {
      name: 'happycal-auth-storage',
      getStorage: () => localStorage,
    }
  )
);

