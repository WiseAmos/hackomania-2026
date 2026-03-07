import { Camera, Upload } from "lucide-react";
import { ChatWager } from "../../../types/chat";
import { ImageMessageBubble } from "./ImageMessageBubble";
import { SystemAlertBubble } from "./SystemAlertBubble";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  activeWager: ChatWager | null;
  onVote: (id: string, v: boolean) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCamera: () => void;
  currentUserId?: string;
  hasUploadedToday?: boolean;
  isSyncing?: boolean;
}

export function ProofChatArea({ activeWager, onVote, onUpload, onOpenCamera, currentUserId, hasUploadedToday, isSyncing }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom nicely
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeWager?.messages]);

  if (!activeWager) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 font-medium">
        <p>Select a challenge to view evidence</p>
      </div>
    );
  }

  // Determine if I need to upload today
  const isRedStatus = activeWager.status === 'red';

  return (
    <div className="flex flex-col h-full relative bg-[#0F172A] w-full">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar scroll-smooth">
        <div className="flex flex-col items-center gap-2 my-4 sticky top-0 z-10 pointers-events-none">
           <span className="bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-white/5 shadow-lg">
             --- TODAY, MAR 8 ---
           </span>
           <AnimatePresence>
             {isSyncing && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-1.5 bg-[#6366F1]/10 border border-[#6366F1]/20 px-2 py-0.5 rounded-full"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
                  <span className="text-[9px] font-black text-[#6366F1] uppercase tracking-widest">Live Syncing</span>
                </motion.div>
             )}
           </AnimatePresence>
        </div>

        {activeWager.messages.map(m => {
          if (m.type === 'system') return <SystemAlertBubble key={m.id} message={m} />;
          if (m.type === 'proof') return <ImageMessageBubble key={m.id} message={m} onVote={onVote} currentUserId={currentUserId} />;
          return null;
        })}
      </div>

      {/* Upload Actions Footer */}
      <div className="p-4 md:p-6 bg-slate-900 border-t border-white/5 shrink-0 z-20 sticky bottom-0">
        {hasUploadedToday ? (
          <div className="w-full py-4 px-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] flex items-center justify-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-500 font-black text-sm uppercase tracking-widest italic">Today's Proof Secured</span>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Camera Button */}
            <button 
              onClick={onOpenCamera}
              className={`flex-1 group relative overflow-hidden py-4 rounded-[1.5rem] font-[family-name:var(--font-heading)] font-bold md:text-lg flex items-center justify-center gap-2 md:gap-3 transition-all duration-300 shadow-[0_0_24px_rgba(99,102,241,0.2)] hover:shadow-[0_0_32px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:scale-[0.98] border border-white/10 ${isRedStatus ? 'bg-gradient-to-r from-[#FF4D4D] to-[#6366F1] animate-pulse hover:animate-none' : 'bg-slate-800 hover:bg-[#6366F1]'} h-full`}
            >
              <Camera className={`w-5 h-5 md:w-6 md:h-6 ${isRedStatus ? 'text-white' : 'text-[#6366F1] group-hover:text-white transition-colors'}`} />
              <span className={isRedStatus ? 'text-white text-xs md:text-lg' : 'text-slate-300 group-hover:text-white transition-colors text-xs md:text-lg'}>📸 Take Photo</span>
              
              {/* Shine effect */}
              {isRedStatus && (
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
              )}
            </button>

            {/* Upload Button */}
            <div className="relative flex-[0.7] md:flex-1">
              <input 
                type="file" 
                accept="image/*" 
                onChange={onUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                title="Upload from device"
              />
              <div className={`w-full group relative overflow-hidden py-4 rounded-[1.5rem] font-[family-name:var(--font-heading)] font-bold md:text-lg flex items-center justify-center gap-2 md:gap-3 transition-all duration-300 shadow-[0_0_24px_rgba(99,102,241,0.2)] hover:shadow-[0_0_32px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:scale-[0.98] border border-white/10 bg-slate-800 hover:bg-[#6366F1] h-full`}>
                 <Upload className="w-5 h-5 md:w-6 md:h-6 text-[#6366F1] group-hover:text-white transition-colors" />
                 <span className="text-slate-300 group-hover:text-white transition-colors text-xs md:text-lg">📁 Upload</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
