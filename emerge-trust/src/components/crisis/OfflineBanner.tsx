import { WifiOff, RefreshCw } from "lucide-react";
import { useOffline } from "@/hooks/useOffline";

function OfflineBanner() {
  const { pendingClaimsCount, syncPendingClaims, isOnline } = useOffline();

  if (isOnline && pendingClaimsCount === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3 text-sm font-medium"
      style={{
        background: isOnline ? "rgba(255, 77, 0, 0.9)" : "rgba(200, 40, 0, 0.95)",
        paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
      }}
      role="alert"
      aria-live="assertive"
    >
      <WifiOff size={16} className="text-white shrink-0" />
      <p className="flex-1 text-white">
        {isOnline && pendingClaimsCount > 0
          ? `Syncing ${pendingClaimsCount} offline claim${pendingClaimsCount > 1 ? "s" : ""}...`
          : "Connection lost. Claims saved securely offline. Auto-submit upon reconnection."}
      </p>
      {isOnline && pendingClaimsCount > 0 && (
        <button
          onClick={syncPendingClaims}
          className="flex items-center gap-1 text-white/80 hover:text-white text-xs"
          aria-label="Sync now"
        >
          <RefreshCw size={14} />
          Sync
        </button>
      )}
    </div>
  );
}

export default OfflineBanner;
