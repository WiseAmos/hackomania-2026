import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppMode, User } from "@/types";

interface AppState {
  mode: AppMode;
  user: User | null;
  isAuthLoading: boolean;

  setMode: (mode: AppMode) => void;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: "peacetime",
      user: null,
      isAuthLoading: true,

      setMode: (mode) => set({ mode }),
      setUser: (user) => set({ user }),
      setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
    }),
    {
      name: "emerge-trust-app",
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
