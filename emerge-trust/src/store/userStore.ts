import { create } from "zustand";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User, Wager, Claim } from "@/types";

interface UserStoreState {
  profile: User | null;
  wagers: Wager[];
  claims: Claim[];
  isLoading: boolean;

  setProfile: (profile: User | null) => void;
  subscribeToProfile: (uid: string) => () => void;
  incrementTrustScore: (uid: string, delta: number) => Promise<void>;
  setWagers: (wagers: Wager[]) => void;
  setClaims: (claims: Claim[]) => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  profile: null,
  wagers: [],
  claims: [],
  isLoading: false,

  setProfile: (profile) => set({ profile }),

  subscribeToProfile: (uid: string) => {
    set({ isLoading: true });

    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const profile: User = {
          uid: snapshot.id,
          ...(snapshot.data() as Omit<User, "uid">),
        };
        set({ profile, isLoading: false });
      } else {
        set({ profile: null, isLoading: false });
      }
    });

    return unsubscribe;
  },

  incrementTrustScore: async (uid: string, delta: number) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      trustScore: increment(delta),
    });
  },

  setWagers: (wagers) => set({ wagers }),
  setClaims: (claims) => set({ claims }),
}));
