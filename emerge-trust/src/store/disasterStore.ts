import { create } from "zustand";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import type { DisasterZone, DisasterStatus } from "@/types";
import { useAppStore } from "./appState";

interface DisasterState {
  zones: DisasterZone[];
  activeZoneIds: string[];
  isLoading: boolean;

  setZones: (zones: DisasterZone[]) => void;
  subscribeToDisasterZones: () => () => void;
  activateZone: (zoneId: string) => Promise<void>;
  resolveZone: (zoneId: string) => Promise<void>;
}

export const useDisasterStore = create<DisasterState>((set, get) => ({
  zones: [],
  activeZoneIds: [],
  isLoading: false,

  setZones: (zones) => {
    const activeZoneIds = zones
      .filter((z) => z.status === "active")
      .map((z) => z.id);

    set({ zones, activeZoneIds });

    // Auto-switch app mode based on active zones
    const { setMode } = useAppStore.getState();
    if (activeZoneIds.length > 0) {
      setMode("crisis");
    } else {
      setMode("peacetime");
    }
  },

  subscribeToDisasterZones: () => {
    set({ isLoading: true });

    const zonesRef = ref(db, "disasterZones");
    const unsubscribe = onValue(zonesRef, (snapshot) => {
      const zones: DisasterZone[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnap) => {
          zones.push({
            id: childSnap.key as string,
            ...(childSnap.val() as Omit<DisasterZone, "id">),
          });
        });
      }

      get().setZones(zones);
      set({ isLoading: false });
    });

    return unsubscribe;
  },

  activateZone: async (zoneId) => {
    const zoneRef = ref(db, `disasterZones/${zoneId}`);
    await update(zoneRef, {
      status: "active" as DisasterStatus,
      activatedAt: new Date().toISOString(),
    });
  },

  resolveZone: async (zoneId) => {
    const zoneRef = ref(db, `disasterZones/${zoneId}`);
    await update(zoneRef, {
      status: "resolved" as DisasterStatus,
      resolvedAt: new Date().toISOString(),
    });
  },
}));
