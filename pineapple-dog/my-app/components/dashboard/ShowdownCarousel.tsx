"use client";

import { motion } from "framer-motion";
import { Camera, Clock, Users } from "lucide-react";
import { Wager } from "../../types/dashboard";

interface Props {
  isLoading: boolean;
  wagers: Wager[];
}

export function ShowdownCarousel({ isLoading, wagers }: Props) {
  if (isLoading) {
    return <div className="h-[200px] w-full bg-slate-800 animate-pulse rounded-2xl border border-white/5" />;
  }

  if (wagers.length === 0) return null;

  return (
    <div className="w-full mb-8">
      <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-white mb-4">
        Active Showdowns <span className="text-[#6366F1] text-sm ml-2 px-2 py-0.5 bg-[#6366F1]/10 rounded-full">{wagers.length}</span>
      </h2>
      
      {/* Horizontal Carousel Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
        {wagers.map((wager) => (
          <motion.div 
            key={wager.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="snap-center shrink-0 w-[300px] sm:w-[350px] bg-slate-800 border border-white/5 rounded-2xl p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="bg-[#FF4D4D]/10 text-[#FF4D4D] text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {wager.timeRemaining}
                </div>
                <div className="text-sm font-bold text-slate-400">
                  S${wager.totalStake} Pool
                </div>
              </div>
              
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-white leading-tight mb-4">
                {wager.title}
              </h3>
            </div>

            <div className="mt-auto">
              {/* Mini Avatars (Alive vs Eliminated) */}
              <div className="flex -space-x-2 mb-4">
                {wager.participants.map((p, i) => (
                  <div 
                    key={i} 
                    className={`w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs font-bold
                      ${p.status === 'alive' ? 'bg-[#6366F1] text-white' : 'bg-slate-700 text-slate-500 opacity-50 grayscale'}
                    `}
                    title={`${p.user.name} (${p.status})`}
                  >
                    {p.user.avatar}
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button className="w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_16px_rgba(99,102,241,0.3)] hover:-translate-y-0.5">
                <Camera className="w-4 h-4" />
                Upload Today's Proof
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
