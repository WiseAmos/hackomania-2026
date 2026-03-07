import { useState, useEffect, useCallback } from "react";
import {
  getPendingOfflineClaims,
  markClaimSynced,
} from "@/lib/indexedDB";
import type { OfflineClaim } from "@/types";

interface UseOfflineReturn {
  isOnline: boolean;
  pendingClaimsCount: number;
  syncPendingClaims: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);

  const updatePendingCount = useCallback(async () => {
    const pending = await getPendingOfflineClaims();
    setPendingClaimsCount(pending.length);
  }, []);

  const syncPendingClaims = useCallback(async () => {
    if (!navigator.onLine) return;

    const pending = await getPendingOfflineClaims();
    if (pending.length === 0) return;

    await Promise.allSettled(
      pending.map(async (offlineClaim: OfflineClaim) => {
        try {
          const res = await fetch("/api/claims", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(offlineClaim.claim),
          });

          if (res.ok) {
            await markClaimSynced(offlineClaim.localId);
          }
        } catch {
          // Keep as pending; will retry on next sync
        }
      })
    );

    await updatePendingCount();
  }, [updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingClaims();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load pending count on mount
    updatePendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPendingClaims, updatePendingCount]);

  return { isOnline, pendingClaimsCount, syncPendingClaims };
}
