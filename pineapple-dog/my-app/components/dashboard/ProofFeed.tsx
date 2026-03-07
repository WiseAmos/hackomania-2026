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
          className="bg-slate-800 border border-white/5 rounded-3xl overflow-hidden shadow-xl"
        >
          {/* Header */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#10B981] text-slate-900 font-bold flex items-center justify-center">
                {post.user.avatar}
              </div>
              <div className="leading-tight">
                <div className="font-bold text-white">{post.user.name} <span className="text-slate-500 font-normal ml-1">{post.user.handle}</span></div>
                <div className="text-xs text-[#6366F1] font-bold uppercase tracking-wider mt-0.5">{post.wager.title}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium">{post.timestamp}</div>
          </div>

          {/* Proof Photo (Large BeReal style) */}
          <div className="relative w-full aspect-[4/5] bg-slate-900 overflow-hidden">
            {/* Using a placeholder unsplash image mapped from data */}
            <img 
              src={post.photoUrl} 
              alt="Proof" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* In a real app we'd overlay the primary/secondary camera logic here */}
          </div>

          {/* Footer & Actions */}
          <div className="p-5">
            <p className="text-slate-300 text-[15px] mb-6"><span className="font-bold text-white mr-2">{post.user.name}</span>{post.caption}</p>

            {/* The Jury Mechanics */}
            <div className="flex gap-4 mb-5">
              <button className="flex-1 flex items-center justify-center gap-2 bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] py-3 rounded-xl font-bold transition-all">
                <Check className="w-5 h-5" />
                Verify
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-[#FF4D4D]/10 hover:bg-[#FF4D4D]/20 border border-[#FF4D4D]/30 text-[#FF4D4D] py-3 rounded-xl font-bold transition-all">
                <X className="w-5 h-5" />
                Call BS
              </button>
            </div>

            {/* Co-Staking / Betting */}
            <div className="flex justify-between items-center border-t border-slate-700 pt-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {post.verifications} Approved
              </div>
              <button className="flex items-center gap-1.5 text-xs font-bold bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1] hover:text-white px-3 py-1.5 rounded border border-[#6366F1]/20 transition-all">
                <HandCoins className="w-3 h-3" />
                Boost Penalty
              </button>
            </div>
          </div>
        </motion.div>
      ))}

    </div>
  );
}
