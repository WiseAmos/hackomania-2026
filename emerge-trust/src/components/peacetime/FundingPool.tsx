import { TrendingUp } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/SkeletonLoader";
import type { CommunityVault } from "@/types";

interface FundingPoolProps {
  vault: CommunityVault | null;
  isLoading?: boolean;
  onFund?: () => void;
}

function FundingPool({ vault, isLoading = false, onFund }: FundingPoolProps) {
  if (isLoading) return <SkeletonCard />;

  const balance = vault
    ? vault.totalBalance / Math.pow(10, vault.assetScale)
    : 0;

  const utilizationPct =
    vault && vault.totalStreamed > 0
      ? Math.min(100, (vault.totalPaidOut / vault.totalStreamed) * 100)
      : 0;

  return (
    <Card glow>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-pt-cyan" />
          <h3 className="text-pt-text font-semibold text-base">
            Community Vault
          </h3>
        </div>
        <span className="text-pt-muted text-xs">
          {vault?.assetCode ?? "SGD"}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-pt-cyan font-black text-3xl tabular-nums">
          ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-pt-muted text-xs mt-1">Available for relief</p>
      </div>

      {/* Utilization bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-pt-muted mb-1.5">
          <span>Fund Utilization</span>
          <span>{utilizationPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-pt-panel overflow-hidden">
          <div
            className="h-full bg-pt-cyan rounded-full transition-all duration-700"
            style={{ width: `${utilizationPct}%` }}
          />
        </div>
      </div>

      <Button variant="primary" size="md" className="w-full" onClick={onFund}>
        Add Funds via Open Payments
      </Button>
    </Card>
  );
}

export default FundingPool;
