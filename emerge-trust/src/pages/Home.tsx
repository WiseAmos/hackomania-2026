import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Settings, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/appState";
import { useDisasterState } from "@/hooks/useDisasterState";
import VaultPulse from "@/components/peacetime/VaultPulse";
import FundingPool from "@/components/peacetime/FundingPool";
import BottomNavBar from "@/components/crisis/BottomNavBar";
import Button from "@/components/ui/Button";
import type { CommunityVault } from "@/types";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

function Home() {
  const { user, mode } = useAppStore();
  const { activeZones, hasActiveDisaster } = useDisasterState();
  const navigate = useNavigate();
  const [vault, setVault] = useState<CommunityVault | null>(null);
  const [vaultLoading, setVaultLoading] = useState(true);

  useEffect(() => {
    const vaultRef = ref(db, "communityVault/main");
    const unsubscribe = onValue(vaultRef, (snap) => {
      if (snap.exists()) {
        setVault({ id: snap.key as string, ...(snap.val() as Omit<CommunityVault, "id">) });
      }
      setVaultLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe pb-4 pt-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-[var(--text-primary)] font-black text-xl tracking-tight">
            EmergeTrust
          </h1>
          <p className="text-[var(--text-muted)] text-xs">
            {mode === "crisis" ? "CRISIS MODE ACTIVE" : `Hi, ${user?.displayName}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Admin"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Crisis alert banner */}
      {hasActiveDisaster && (
        <div className="mx-4 mt-4 p-4 rounded-2xl border border-cr-orange/60 bg-cr-surface flex items-start gap-3">
          <AlertTriangle size={20} className="text-cr-orange shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-cr-text font-bold text-sm">
              Disaster Alert Active
            </p>
            <p className="text-cr-muted text-xs mt-0.5">
              {activeZones.map((z) => z.name).join(", ")} — Claims are now open
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/claim")}
            className="shrink-0"
          >
            Claim
          </Button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 px-4 py-4 space-y-4 pb-24">
        {mode === "peacetime" ? (
          <>
            <VaultPulse vault={vault} isLoading={vaultLoading} />
            <FundingPool
              vault={vault}
              isLoading={vaultLoading}
              onFund={() => navigate("/wager")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate("/wager")}
              >
                Lock Wager
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => navigate("/profile")}
              >
                Profile
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-cr-orange bg-cr-surface text-center">
              <AlertTriangle size={40} className="text-cr-orange mx-auto mb-3" />
              <h2 className="text-cr-text font-black text-xl">
                Crisis Mode Active
              </h2>
              <p className="text-cr-muted text-sm mt-2">
                Disaster detected in your area. Submit a claim or vote on
                pending claims below.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/claim")}
            >
              Submit Claim
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/vote")}
            >
              Vote on Claims
            </Button>
          </div>
        )}
      </main>

      {/* Bottom nav (always shown in crisis) */}
      {mode === "crisis" && <BottomNavBar />}
    </div>
  );
}

export default Home;
