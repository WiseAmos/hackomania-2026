import { useMemo } from "react";
import type { CommunityVault } from "@/types";

interface VaultPulseProps {
  vault: CommunityVault | null;
  isLoading?: boolean;
}

function VaultPulse({ vault, isLoading = false }: VaultPulseProps) {
  const formattedBalance = useMemo(() => {
    if (!vault) return "0.00";
    const value = vault.totalBalance / Math.pow(10, vault.assetScale);
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [vault]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-48 h-48 rounded-full skeleton" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 select-none">
      {/* Outer glow ring */}
      <div className="relative flex items-center justify-center vault-breathe">
        <div className="absolute w-52 h-52 rounded-full bg-pt-cyan/5 blur-xl" />
        <div className="absolute w-44 h-44 rounded-full border border-pt-cyan/20" />

        {/* Main vault sphere */}
        <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-pt-panel via-pt-surface to-pt-bg border-2 border-pt-cyan/60 flex flex-col items-center justify-center gap-1 shadow-[inset_0_0_40px_rgba(0,240,255,0.08),0_0_60px_rgba(0,240,255,0.15)]">
          <span className="text-pt-muted text-xs font-medium uppercase tracking-widest">
            Vault
          </span>
          <span className="text-pt-cyan text-2xl font-black tabular-nums leading-none">
            ${formattedBalance}
          </span>
          <span className="text-pt-muted text-xs">
            {vault?.assetCode ?? "SGD"}
          </span>
        </div>

        {/* Orbiting particles */}
        <div className="absolute w-52 h-52 rounded-full border border-pt-cyan/10 animate-spin [animation-duration:12s]">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pt-cyan" />
        </div>
      </div>

      {/* Stats row */}
      {vault && (
        <div className="flex gap-8 mt-6 text-center">
          <div>
            <p className="text-pt-muted text-xs uppercase tracking-wider">
              Streamed In
            </p>
            <p className="text-pt-text font-semibold text-sm">
              ${(vault.totalStreamed / Math.pow(10, vault.assetScale)).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-pt-muted text-xs uppercase tracking-wider">
              Paid Out
            </p>
            <p className="text-pt-text font-semibold text-sm">
              ${(vault.totalPaidOut / Math.pow(10, vault.assetScale)).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VaultPulse;
