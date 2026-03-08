"use client";

import { Trophy } from "lucide-react";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { motion } from "framer-motion";

export function PoolDisplay() {
  const { stats } = usePlatformStats();
  
  const formattedAmount = stats?.totalValueLocked 
    ? new Intl.NumberFormat('en-SG', {
        style: 'currency',
        currency: 'SGD',
        maximumFractionDigits: 0
      }).format(stats.totalValueLocked)
    : "S$0";

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-3 bg-gradient-to-b from-amber-400/20 to-amber-600/10 border border-amber-500/40 rounded-2xl px-5 py-2 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all group relative overflow-hidden"
    >
      {/* Golden Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
      
      <div className="relative">
        <Trophy className="w-6 h-6 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
        <motion.div 
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-1 bg-amber-500/20 blur-sm rounded-full"
        />
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.2em] leading-none mb-1 drop-shadow-sm font-[family-name:var(--font-heading)]">
          Emergency Funds Pool
        </span>
        <span className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] font-[family-name:var(--font-heading)]">
          {formattedAmount}
        </span>
      </div>
    </motion.div>
  );
}
