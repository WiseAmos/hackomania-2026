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
      <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
        {wagers.map((wager, index) => (
          <motion.div
            key={wager.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full bg-slate-800 border border-white/5 rounded-3xl p-5 flex flex-col sm:flex-row gap-5 items-center justify-between shadow-lg"
          >
            <div className="flex-1 w-full flex flex-col justify-center">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-[#FF4D4D]/10 text-[#FF4D4D] text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max">
                  <Clock className="w-3.5 h-3.5" /> {wager.timeRemaining}
                </div>
                <div className="text-xs font-bold text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/5 sm:hidden">
                  S${wager.totalStake} Pool
                </div>
              </div>

              <h3 className="font-[family-name:var(--font-heading)] text-lg sm:text-xl font-bold text-white leading-tight mb-4">
                {wager.title}
              </h3>

              {/* Mini Avatars & Pool Row */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {wager.participants.map((p, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs sm:text-sm font-bold shadow-md
                        ${p.status === 'alive' ? 'bg-[#6366F1] text-white' : 'bg-slate-700 text-slate-500 opacity-50 grayscale'}
                      `}
                      title={`${p.user.name} (${p.status})`}
                    >
                      {p.user.avatar.startsWith('http') ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.user.avatar} alt={p.user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        p.user.avatar
                      )}
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block text-xs font-bold text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/5">
                  S${wager.totalStake} Pool
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-3.5 rounded-2xl text-[14px] font-bold transition-all shadow-[0_0_24px_rgba(99,102,241,0.3)] hover:-translate-y-0.5">
              <Camera className="w-4.5 h-4.5" />
              Upload Proof
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
