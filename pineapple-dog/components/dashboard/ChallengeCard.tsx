"use client";

import { motion } from "framer-motion";
import { Users, HandCoins, Camera, Clock } from "lucide-react";
import { User, Wager, ProofPost } from "../../types/dashboard";

interface ChallengeCardProps {
  type: 'post' | 'active-goal';
  data: ProofPost | Wager;
  onAction: (data: any) => void;
}

export function ChallengeCard({ type, data, onAction }: ChallengeCardProps) {
  const isPost = type === 'post';
  const post = isPost ? (data as ProofPost) : null;
  const wager = isPost ? null : (data as Wager);

  // Unified data extraction
  const photoUrl = isPost ? post?.photoUrl : wager?.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800";
  const user = isPost ? post?.user : { name: "You", avatar: "A", handle: "@alex" }; // Assuming local user for active goals
  const title = isPost ? post?.wager.title : wager?.title;
  const timestamp = isPost ? post?.timestamp : wager?.timeRemaining;
  const verifications = isPost ? (post?.verifications ?? 0) : 0;
  const stake = isPost ? (post?.verifications ?? 0) * 10 : (wager?.totalStake ?? 0);
  const caption = isPost ? post?.caption : wager?.description;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800 border border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-row md:flex-col relative group h-full"
    >
      {/* Visual Accent */}
      <div className={`absolute top-0 left-0 w-1 md:w-full h-full md:h-1 opacity-50 z-10 bg-gradient-to-b md:bg-gradient-to-r ${isPost ? "from-[#6366F1] to-[#10B981]" : "from-[#FF4D4D] to-[#6366F1]"}`} />

      {/* Proof Snapshot Thumbnail */}
      <div className="w-28 sm:w-36 md:w-full aspect-square md:aspect-[4/3] bg-slate-900 overflow-hidden relative shrink-0">
        <img 
          src={photoUrl} 
          alt="Thumbnail" 
          className={`w-full h-full object-cover transition-transform duration-700 ${isPost ? "group-hover:scale-105" : "grayscale opacity-40"}`}
          loading="lazy"
        />
        
        {!isPost && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
               <Camera className="w-5 h-5 text-white/40" />
            </div>
          </div>
        )}

        {/* Overlaid Data Column (Desktop Only) */}
        <div className="hidden md:flex absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
          <div className="text-[9px] text-white font-black bg-slate-950/70 backdrop-blur-md px-2 py-1 rounded border border-white/10 shadow-xl flex items-center gap-1">
            {!isPost && <Clock className="w-2.5 h-2.5" />}
            {timestamp}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md px-2 py-1 rounded border border-white/10 shadow-xl">
            <Users className="w-2.5 h-2.5 text-slate-400" />
            <span className="text-[9px] font-black text-white">{isPost ? (post!.verifications % 8) + 2 : (wager!.participants?.length ?? 2)}</span>
          </div>
          <div className={`flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md px-2 py-1 rounded border shadow-xl ${isPost ? "bg-[#10B981]/90 border-[#10B981]/20" : "bg-[#6366F1]/90 border-[#6366F1]/20"}`}>
            <span className="text-[9px] font-black text-white">S${stake}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3 md:p-5 flex flex-col flex-grow min-w-0 justify-between">
        <div className="flex flex-col flex-grow">
          <div className="flex items-center justify-between md:justify-start gap-2 md:gap-3 mb-2 md:mb-3.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full text-slate-900 text-[10px] md:text-xs font-bold flex items-center justify-center shrink-0 shadow-lg border border-white/10 ${isPost ? "bg-[#10B981]" : "bg-[#6366F1] text-white"}`}>
                {user!.avatar}
              </div>
              <div className="leading-tight min-w-0">
                <div className="font-bold text-white text-[12px] md:text-sm truncate">{user!.name}</div>
              </div>
            </div>
            <div className="text-[8px] md:text-[10px] font-bold text-[#6366F1] uppercase tracking-wider bg-[#6366F1]/10 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-md shrink-0">
              {title}
            </div>
          </div>

          {/* Mobile Stats Row */}
          <div className="flex md:hidden items-center gap-2 mb-2 overflow-x-auto no-scrollbar pb-0.5">
             <div className="flex items-center h-5 bg-slate-700/50 px-1.5 rounded border border-white/5 whitespace-nowrap gap-1">
               {!isPost && <Clock className="w-2.5 h-2.5 text-slate-400" />}
               <span className="text-[8px] text-white/50 font-bold leading-none">{timestamp}</span>
             </div>
             <div className="flex items-center h-5 bg-slate-700/50 px-1.5 rounded border border-white/5 shrink-0 whitespace-nowrap gap-1">
               <Users className="w-2.5 h-2.5 text-slate-400" />
               <span className="text-[8px] font-bold text-white/70 leading-none">{isPost ? (post!.verifications % 8) + 2 : wager!.participants.length}</span>
             </div>
             <div className={`flex items-center h-5 px-1.5 rounded border shrink-0 whitespace-nowrap ${isPost ? "bg-[#10B981]/15 border-[#10B981]/10" : "bg-[#6366F1]/15 border-[#6366F1]/10"}`}>
               <span className={`text-[8px] font-bold leading-none ${isPost ? "text-[#10B981]" : "text-[#6366F1]"}`}>S${stake}</span>
             </div>
          </div>

          <p className="text-slate-300 text-[11px] md:text-[13px] italic leading-snug md:leading-relaxed line-clamp-2 mb-2 md:mb-4">
            "{caption}"
          </p>
        </div>

        <div className="mt-auto">
          <button 
            onClick={() => onAction(data)}
            className={`w-full flex items-center justify-center gap-1.5 md:gap-2 text-white py-1.5 md:py-3 rounded-xl md:rounded-2xl font-bold transition-all text-[11px] md:text-sm hover:-translate-y-0.5 shadow-2xl active:scale-95 bg-gradient-to-r ${isPost ? "from-[#6366F1] to-[#8B5CF6] shadow-[#6366F1]/20" : "from-[#FF4D4D] to-[#6366F1] shadow-[#FF4D4D]/20"}`}
          >
            {isPost ? (
              <>
                <HandCoins className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Raise <span className="hidden sm:inline">Stakes</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Capture Proof
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
