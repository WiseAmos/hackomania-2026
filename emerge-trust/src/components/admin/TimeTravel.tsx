import { useState } from "react";
import { Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function TimeTravel() {
  const [claimId, setClaimId] = useState("");
  const [isAccelerating, setIsAccelerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTimeTravel = async () => {
    if (!claimId) return;
    setIsAccelerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/time-travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(
          `Voting window for Claim #${claimId.slice(-6).toUpperCase()} resolved immediately. Outcome: ${data.outcome.toUpperCase()}`
        );
      } else {
        setResult(data.message ?? "Failed to accelerate voting.");
      }
    } catch {
      setResult("Time travel failed. Check server logs.");
    } finally {
      setIsAccelerating(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-purple-400" />
        <h3 className="text-pt-text font-semibold">Time Travel</h3>
      </div>
      <p className="text-pt-muted text-xs mb-4">
        Accelerate the 24-hour voting window for a specific claim, immediately
        resolving Tier 2 payout.
      </p>
      <div className="space-y-3">
        <input
          type="text"
          value={claimId}
          onChange={(e) => setClaimId(e.target.value)}
          placeholder="Claim ID..."
          className="w-full bg-pt-panel border border-[var(--border)] rounded-xl px-4 py-3 text-pt-text text-sm placeholder:text-pt-muted focus:outline-none focus:border-pt-cyan/60 transition-colors"
        />
        <Button
          variant="secondary"
          size="md"
          className="w-full border-purple-400/40 text-purple-400 hover:bg-purple-400/10"
          onClick={handleTimeTravel}
          isLoading={isAccelerating}
          disabled={!claimId}
        >
          <Clock size={14} className="mr-2" />
          Accelerate Voting Window
        </Button>
        {result && (
          <p className="text-purple-400 text-xs text-center">{result}</p>
        )}
      </div>
    </Card>
  );
}

export default TimeTravel;
