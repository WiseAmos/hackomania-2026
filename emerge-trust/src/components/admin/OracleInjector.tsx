import { useState } from "react";
import { Zap } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useDisasterStore } from "@/store/disasterStore";

function OracleInjector() {
  const { zones, activateZone } = useDisasterStore();
  const [selectedZone, setSelectedZone] = useState("");
  const [isTriggering, setIsTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleTrigger = async () => {
    if (!selectedZone) return;
    setIsTriggering(true);
    setMessage(null);
    try {
      await activateZone(selectedZone);
      setMessage(`Flood Alert activated for zone: ${selectedZone}`);
    } catch (err) {
      setMessage("Failed to activate zone.");
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-pt-cyan" />
        <h3 className="text-pt-text font-semibold">Inject Synthetic Oracle</h3>
      </div>
      <p className="text-pt-muted text-xs mb-4">
        Manually trigger a "Flood Alert" for a specific geofence zone to switch
        the app to Crisis Mode.
      </p>
      <div className="space-y-3">
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="w-full bg-pt-panel border border-[var(--border)] rounded-xl px-4 py-3 text-pt-text text-sm focus:outline-none focus:border-pt-cyan/60 transition-colors"
        >
          <option value="">Select zone...</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} ({z.status})
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={handleTrigger}
          isLoading={isTriggering}
          disabled={!selectedZone}
        >
          <Zap size={14} className="mr-2" />
          Trigger Flood Alert
        </Button>
        {message && (
          <p className="text-pt-cyan text-xs text-center">{message}</p>
        )}
      </div>
    </Card>
  );
}

export default OracleInjector;
