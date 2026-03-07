"use client";

import { motion } from "framer-motion";
import { Activity, Flame, ShieldAlert, Award } from "lucide-react";
import { ImpactClaim, PlatformStats } from "../../types/dashboard";

interface Props {
  isLoading: boolean;
  claims: ImpactClaim[];
  stats: PlatformStats | null;
}

export function ImpactSidebar({ isLoading, claims, stats }: Props) {
  if (isLoading) {
    return <div className="h-[600px] w-full bg-slate-800 animate-pulse rounded-2xl border border-white/5" />;
  }

  const isZeroState = claims.length === 0;

  return (
    <div className="w-full flex justify-end">
      {/* Right Sidebar layout constraint on Desktop */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-[350px] sticky top-8 flex flex-col gap-6"
      >
        
        {/* Treasury / Vault Status (Macro Platform Stats) */}
        {stats && (
          <div className="bg-slate-800 border border-[#10B981]/10 rounded-3xl p-6 shadow-[0_16px_32px_rgba(16,185,129,0.02)] overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.05)_0%,_transparent_60%)] pointer-events-none" />
            
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold flex items-center gap-2 mb-4 text-[#10B981]">
              <Activity className="w-4 h-4" /> Global Treasury
            </h2>

            <div className="space-y-4">
               <div>
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Value Locked</div>
                 <div className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                   S${stats.totalValueLocked.toLocaleString()}
                 </div>
               </div>
               
               <div>
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Relief Paid</div>
                 <div className="font-[family-name:var(--font-heading)] text-xl font-bold text-[#10B981]">
                   S${stats.totalReliefPaid.toLocaleString()}
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Impact Portfolio Section */}
        <div className="bg-slate-800 border border-white/5 rounded-3xl p-6 flex-1 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-slate-400" />
            <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white">
              My Impact Portfolio
            </h3>
          </div>

          {/* Interactive Mini-Map Placeholder */}
          <div className="w-full aspect-[4/3] bg-slate-900 rounded-2xl mb-6 relative overflow-hidden border border-white/5 flex items-center justify-center">
            {/* Grid Pattern */}
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            {/* Nodes */}
            {isZeroState ? (
               <ShieldAlert className="w-12 h-12 text-slate-700 opacity-50 relative z-10" />
            ) : (
               <>
                 <div className="absolute w-4 h-4 bg-[#10B981] rounded-full top-[30%] left-[20%] z-20 shadow-[0_0_16px_rgba(16,185,129,0.8)]">
                    <div className="absolute inset-0 animate-ping rounded-full bg-[#10B981]" />
                 </div>
                 <div className="absolute w-3 h-3 bg-[#06B6D4] rounded-full bottom-[40%] right-[30%] z-20 shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                    <div className="absolute inset-0 animate-ping rounded-full bg-[#06B6D4] delay-700" />
                 </div>
               </>
            )}
          </div>

          {/* Ledger or Zero State */}
          {isZeroState ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-400 mb-5">Your failed wagers fuel disaster relief. Start a showdown to build your trophy case.</p>
              <button className="w-full py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-slate-300 font-bold hover:bg-slate-700 transition-colors">
                 Start a Showdown
              </button>
            </div>
          ) : (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Verified Relief Funded</div>
              <div className="flex flex-col gap-3">
                {claims.map((claim) => (
                  <div key={claim.id} className="bg-slate-900/50 border border-white/5 rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden group hover:border-[#10B981]/30 transition-colors">
                     <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#10B981] to-[#06B6D4] opacity-50" />
                     <div className="flex justify-between items-center pl-2">
                       <span className="text-xs text-slate-400 font-medium line-clamp-1 flex-1 pr-2">{claim.wagerTitle}</span>
                       <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{claim.timestamp}</span>
                     </div>
                     <div className="pl-2 flex items-center gap-1.5 mt-1">
                        <Flame className="w-3.5 h-3.5 text-[#FF4D4D]" />
                        <span className="text-[15px] font-[family-name:var(--font-heading)] font-bold text-white">
                          S${claim.amount}
                        </span>
                        <span className="text-[13px] text-slate-300 ml-1 leading-snug tracking-tight">
                          → {claim.reliefFund}
                        </span>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
}
