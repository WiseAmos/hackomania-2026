"use client";

import { motion } from "framer-motion";
import { Check, X, HandCoins, AlertCircle } from "lucide-react";
import { ProofPost } from "../../types/dashboard";

interface Props {
  isLoading: boolean;
  posts: ProofPost[];
}

export function ProofFeed({ isLoading, posts }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-800 rounded-full animate-pulse" />
        <div className="h-96 w-full bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Zero State for new users
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-800 border border-white/5 rounded-3xl">
        <h3 className="text-xl font-[family-name:var(--font-heading)] font-bold text-white mb-2">It's Quiet Here...</h3>
        <p className="text-slate-400 mb-6">Join your first community showdown or invite friends to fill up your feed.</p>
        <button className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-3 rounded-full font-bold shadow-[0_0_24px_rgba(99,102,241,0.3)]">
          Explore Global Challenges
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-lg mx-auto">
      
      {/* Toggles */}
      <div className="flex bg-slate-800/50 p-1.5 rounded-full border border-white/5 w-max mx-auto mb-2">
        <button className="px-5 py-2 rounded-full text-sm font-bold bg-slate-700 text-white shadow">Following</button>
        <button className="px-5 py-2 rounded-full text-sm font-bold text-slate-400 hover:text-white transition-colors">Trending</button>
        <button className="px-5 py-2 rounded-full text-sm font-bold text-slate-400 hover:text-white transition-colors">Global</button>
      </div>

      {/* Posts Loop */}
      {posts.map((post) => (
        <motion.div 
          key={post.id} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-white/5 rounded-3xl overflow-hidden shadow-xl flex flex-col sm:flex-row relative group"
        >
          {/* Visual Accent */}
          <div className="hidden sm:block absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#6366F1] to-[#10B981] opacity-50 z-10" />
          <div className="sm:hidden absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#6366F1] to-[#10B981] opacity-50 z-10" />

          {/* Proof Snapshot Thumbnail */}
          <div className="w-full sm:w-48 sm:min-w-[12rem] aspect-[4/3] sm:aspect-square sm:h-auto bg-slate-900 overflow-hidden relative border-b sm:border-b-0 sm:border-r border-white/10 shrink-0">
            <img 
              src={post.photoUrl} 
              alt="Proof" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          {/* Details and Actions */}
          <div className="p-5 sm:px-6 py-5 flex flex-col justify-between w-full">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-[#10B981] text-slate-900 text-sm font-bold flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                    {post.user.avatar}
                  </div>
                  <div className="leading-none flex flex-col justify-center">
                    <div className="font-bold text-white text-sm sm:text-base mb-1">{post.user.name} <span className="text-slate-500 font-normal ml-1 hidden sm:inline-block">{post.user.handle}</span></div>
                    <div className="text-[10px] font-bold text-[#6366F1] uppercase tracking-wider truncate max-w-[150px] sm:max-w-xs bg-[#6366F1]/10 px-2 py-0.5 rounded w-max">{post.wager.title}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap bg-slate-800/50 px-2 py-1.5 rounded-md border border-white/5">{post.timestamp}</div>
              </div>

              <p className="text-slate-300 text-[13px] sm:text-sm italic leading-relaxed mb-4 line-clamp-2 min-h-[40px]">
                "{post.caption}"
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-auto border-t border-white/5 pt-4 gap-4">
               
               <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                 <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                   <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> {post.verifications} Approved
                 </span>
                 <button className="flex items-center gap-1.5 text-xs font-bold bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1] hover:text-white px-3 py-1.5 rounded-lg border border-[#6366F1]/20 transition-all hover:-translate-y-0.5 sm:hidden">
                   <HandCoins className="w-3.5 h-3.5" />
                   Boost Penalty
                 </button>
               </div>

               <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#10B981]/10 hover:bg-[#10B981] hover:text-white border border-[#10B981]/30 text-[#10B981] px-4 py-2 rounded-xl font-bold transition-all text-xs hover:-translate-y-0.5 shadow-[0_0_12px_rgba(16,185,129,0.1)] hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]">
                   <Check className="w-4 h-4" />
                   Verify
                 </button>
                 <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#FF4D4D]/10 hover:bg-[#FF4D4D] hover:text-white border border-[#FF4D4D]/30 text-[#FF4D4D] px-4 py-2 rounded-xl font-bold transition-all text-xs hover:-translate-y-0.5 shadow-[0_0_12px_rgba(255,77,77,0.1)] hover:shadow-[0_0_16px_rgba(255,77,77,0.3)]">
                   <X className="w-4 h-4" />
                   Call BS
                 </button>
                 <button className="hidden sm:flex items-center justify-center gap-2 bg-[#6366F1]/10 hover:bg-[#6366F1] hover:text-white border border-[#6366F1]/30 text-[#6366F1] px-4 py-2 rounded-xl font-bold transition-all text-xs hover:-translate-y-0.5 shadow-[0_0_12px_rgba(99,102,241,0.1)] hover:shadow-[0_0_16px_rgba(99,102,241,0.3)]">
                   <HandCoins className="w-4 h-4" />
                   Boost
                 </button>
               </div>

            </div>
          </div>
        </motion.div>
      ))}

    </div>
  );
}
