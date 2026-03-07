import { Lock, CheckCircle, XCircle, Zap } from "lucide-react";
import type { Wager } from "@/types";
import Card from "@/components/ui/Card";

interface WagerCardProps {
  wager: Wager;
  onFailSimulate?: (wagerId: string) => void;
}

const STATUS_CONFIG = {
  locked: {
    icon: Lock,
    label: "Locked",
    color: "text-pt-cyan",
    bg: "bg-pt-cyan/10",
  },
  success: {
    icon: CheckCircle,
    label: "Success",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  streaming: {
    icon: Zap,
    label: "Streaming",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
} as const;

function WagerCard({ wager }: WagerCardProps) {
  const config = STATUS_CONFIG[wager.status];
  const StatusIcon = config.icon;

  const amount = wager.amount / Math.pow(10, wager.assetScale);
  const deadlineDate = new Date(wager.deadlineAt);
  const isExpired = deadlineDate < new Date();

  return (
    <Card glow={wager.status === "locked"}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-pt-text font-semibold text-base leading-snug truncate">
            {wager.goalDescription}
          </p>
          <p className="text-pt-muted text-xs mt-1">
            Deadline:{" "}
            {isExpired ? (
              <span className="text-red-400">Expired</span>
            ) : (
              deadlineDate.toLocaleDateString()
            )}
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color} ${config.bg}`}
        >
          <StatusIcon size={12} />
          {config.label}
        </div>
      </div>

      <div className="flex items-end justify-between mt-4">
        <div>
          <p className="text-pt-muted text-xs uppercase tracking-wider">
            Committed
          </p>
          <p className="text-pt-cyan font-black text-2xl tabular-nums">
            ${amount.toFixed(2)}
          </p>
        </div>

        {wager.status === "streaming" && (
          <div className="text-right">
            <p className="text-pt-muted text-xs">Streamed</p>
            <p className="text-amber-400 font-semibold">
              ${(wager.streamedAmount / Math.pow(10, wager.assetScale)).toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar for streaming */}
      {wager.status === "streaming" && wager.amount > 0 && (
        <div className="mt-3 h-1.5 rounded-full bg-pt-panel overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                (wager.streamedAmount / wager.amount) * 100
              )}%`,
            }}
          />
        </div>
      )}
    </Card>
  );
}

export default WagerCard;
