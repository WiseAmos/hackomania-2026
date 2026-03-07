import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useDisasterState } from "@/hooks/useDisasterState";
import { useAppStore } from "@/store/appState";
import ClaimForm from "@/components/crisis/ClaimForm";
import BottomNavBar from "@/components/crisis/BottomNavBar";
import Button from "@/components/ui/Button";

function ClaimPage() {
  const navigate = useNavigate();
  const { activeZones, hasActiveDisaster } = useDisasterState();
  const { mode } = useAppStore();

  const firstActiveZone = activeZones[0];

  if (!hasActiveDisaster) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-[var(--border)]">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center text-pt-muted hover:text-pt-text transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-pt-text font-bold text-lg">Submit Claim</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-4">
          <AlertTriangle size={48} className="text-pt-muted" />
          <div>
            <h2 className="text-pt-text font-bold text-xl">No Active Disaster</h2>
            <p className="text-pt-muted text-sm mt-2">
              Claims can only be submitted in active disaster zones. Check back
              when an alert is issued.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-cr-bg">
      <header className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-cr-orange/40">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-cr-surface flex items-center justify-center text-cr-muted hover:text-cr-text transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-cr-text font-bold text-lg">Submit Claim</h1>
          <p className="text-cr-orange text-xs font-semibold uppercase tracking-wider">
            {firstActiveZone?.name ?? "Active Zone"}
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-28">
        <div className="mb-4 p-3 rounded-xl border border-cr-orange/40 bg-cr-surface flex items-center gap-2">
          <AlertTriangle size={14} className="text-cr-orange shrink-0" />
          <p className="text-cr-muted text-xs">
            20% paid instantly upon submission. 80% released after 24h community vote.
          </p>
        </div>

        <ClaimForm
          zoneId={firstActiveZone?.id ?? ""}
          onSubmitted={(id) => {
            navigate("/", { state: { submittedClaimId: id } });
          }}
        />
      </main>

      {mode === "crisis" && <BottomNavBar />}
    </div>
  );
}

export default ClaimPage;
