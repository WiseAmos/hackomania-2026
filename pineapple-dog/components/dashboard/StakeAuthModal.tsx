"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, AlertTriangle, X, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

interface StakeAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  wagerId: string;
  wagerTitle: string;
  stakeAmount: number; // in dollars
  onSuccess?: () => void;
}

export function StakeAuthModal({
  isOpen,
  onClose,
  wagerId,
  wagerTitle,
  stakeAmount,
  onSuccess,
}: StakeAuthModalProps) {
  const { user } = useAuth();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = async () => {
    if (!user) return;

    const walletAddress = user.interledgerLink || user.walletAddress;
    if (!walletAddress) {
      setError("Please set your Interledger wallet address in your Profile first.");
      return;
    }

    setIsAuthorizing(true);
    setError(null);

    try {
      const amountCents = Math.round(stakeAmount * 100).toString();

      // Save reference so the dashboard callback knows which wager to update
      sessionStorage.setItem("pendingJoin", JSON.stringify({ wagerId, stakeAmount }));

      const params = new URLSearchParams({
        walletAddress,
        amount: amountCents,
        player: "participant",
        title: `Stake: ${wagerTitle}`,
        description: `Authorizing $${stakeAmount} SGD stake for challenge`,
        deadline: "",
        wagerId,
      });

      const res = await fetch(`/api/ilp/grant?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to request grant");

      sessionStorage.setItem("pendingJoinGrantId", data.grantId);

      // Redirect to wallet authorization
      window.location.href = data.grantUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsAuthorizing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-b from-amber-500/10 to-transparent px-6 pt-8 pb-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 mb-4"
              >
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </motion.div>

              <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-white mb-2">
                Stake Authorization Required
              </h2>
              <p className="text-slate-400 text-sm">
                Your stake for this challenge hasn't been authorized yet. Authorize it via your Interledger wallet to complete your entry.
              </p>
            </div>

            {/* Wager Info */}
            <div className="mx-6 mb-4 p-4 rounded-2xl bg-slate-800/60 border border-white/5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Challenge</p>
              <p className="text-white font-semibold text-sm truncate">{wagerTitle}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">Required Stake</span>
                <span className="text-[#6366F1] font-bold text-lg">${stakeAmount.toFixed(2)} SGD</span>
              </div>
            </div>

            {/* Info callout */}
            <div className="mx-6 mb-5 flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Funds are <strong className="text-slate-200">not charged immediately</strong>. They are held in escrow by the Interledger protocol and only released when the challenge resolves.
              </p>
            </div>

            {error && (
              <div className="mx-6 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={isAuthorizing}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white border border-white/5 transition-all disabled:opacity-50"
              >
                Later
              </button>
              <button
                onClick={handleAuthorize}
                disabled={isAuthorizing}
                className="flex-[2] py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:-translate-y-0.5 active:scale-95 shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
              >
                {isAuthorizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to Wallet...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Authorize Stake
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
