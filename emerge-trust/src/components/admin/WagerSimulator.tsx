import { useState } from "react";
import { Users } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function WagerSimulator() {
  const [count, setCount] = useState(50);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSimulate = async () => {
    setIsSimulating(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/simulate-wager-fails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      setResult(
        `Simulated ${data.processed} wager failures. $${(data.totalStreamed / 100).toFixed(2)} streamed to CommunityVault.`
      );
    } catch {
      setResult("Simulation failed. Check server logs.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-amber-400" />
        <h3 className="text-pt-text font-semibold">Simulate Wager Failures</h3>
      </div>
      <p className="text-pt-muted text-xs mb-4">
        Simulate users failing their commitment wagers, triggering ILP streams
        to the CommunityVault.
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-pt-muted text-xs uppercase tracking-wider whitespace-nowrap">
            Users to fail
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={500}
            className="flex-1 bg-pt-panel border border-[var(--border)] rounded-xl px-4 py-2.5 text-pt-text text-sm focus:outline-none focus:border-pt-cyan/60 transition-colors"
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          className="w-full border-amber-400/40 text-amber-400 hover:bg-amber-400/10"
          onClick={handleSimulate}
          isLoading={isSimulating}
        >
          <Users size={14} className="mr-2" />
          Simulate {count} Wager Fails
        </Button>
        {result && (
          <p className="text-amber-400 text-xs text-center">{result}</p>
        )}
      </div>
    </Card>
  );
}

export default WagerSimulator;
