"use client";

import { motion } from "framer-motion";
import { Award, Flame, ShieldAlert } from "lucide-react";
import { ImpactClaim } from "../../types/dashboard";

interface Props {
  isLoading: boolean;
  claims: ImpactClaim[];
}

export function ImpactSection({ isLoading, claims }: Props) {
  const isZeroState = claims.length === 0;

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#10B981]/30 shadow-[0_0_24px_rgba(16,185,129,0.4)]"
        >
          <Award className="w-8 h-8 text-[#10B981]" />
        </motion.div>
        <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white mb-3">
          Your Trophy Case
        </h2>
        <p className="text-slate-400 text-[15px] max-w-lg mx-auto">
          When you lose, the world wins. Here are the faces and causes directly funded by your failed wagers.
        </p>
      </div>

      {/* The Impact Ledger (Recipient Profile Cards) */}
      {isLoading ? (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
          <div className="h-32 w-full bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-32 w-full bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      ) : isZeroState ? (
        <div className="w-full aspect-[4/3] max-h-[300px] bg-slate-800 border border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <ShieldAlert className="w-12 h-12 text-slate-700 opacity-50 relative z-10 mb-4" />
          <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white relative z-10 mb-2">No Relief Funded Yet</h3>
          <p className="text-slate-400 relative z-10 max-w-sm mb-6 text-sm">You haven't lost any wagers yet! Start a showdown to begin building your impact portfolio.</p>
          <button className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full font-bold relative z-10 shadow-lg hover:-translate-y-0.5 transition-all text-sm">
            Enter The Arena
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
          {claims.map((claim, index) => (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800 border border-white/5 hover:border-[#10B981]/50 rounded-3xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group transition-colors shadow-lg"
            >
              {/* Visual Connector Accent */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#10B981] to-[#06B6D4] opacity-80" />

              {/* Left Side: The Recipient Profile */}
              <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:border-r border-white/10 sm:pr-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#10B981] blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-[#10B981]/30 text-[#10B981] font-[family-name:var(--font-heading)] font-bold flex flex-shrink-0 items-center justify-center text-xl relative z-10 overflow-hidden">
                    {claim.recipient.avatar.startsWith('http') ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={claim.recipient.avatar} alt={claim.recipient.name} className="w-full h-full object-cover" />
                    ) : (
                      claim.recipient.avatar
                    )}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="inline-flex text-[10px] font-bold bg-[#06B6D4]/10 text-[#06B6D4] px-2 py-0.5 rounded mb-2 uppercase tracking-wide">
                    {claim.reliefFund}
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight mb-2">{claim.recipient.name}</h3>
                  <p className="text-xs text-slate-400 italic leading-relaxed">
                    "{claim.recipient.bio}"
                  </p>
                </div>
              </div>

              {/* Right Side: The Math / Wager Context */}
              <div className="w-full md:w-56 flex flex-col justify-center items-center md:items-end text-center md:text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Funded via Failure</div>
                <div className="text-slate-300 font-medium mb-3 text-sm">"{claim.wagerTitle}"</div>

                <div className="bg-slate-900 px-4 py-2 rounded-2xl border border-white/5 flex items-center justify-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF4D4D]" />
                  <span className="font-[family-name:var(--font-heading)] text-xl font-bold text-white">
                    S${claim.amount}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-3">{claim.timestamp}</div>
              </div>

            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}
