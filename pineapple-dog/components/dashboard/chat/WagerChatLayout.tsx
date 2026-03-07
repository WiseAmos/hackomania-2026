import { useState, useEffect } from "react";
import { useWagerChat } from "../../../hooks/useWagerChat";
import { WagerSidebar } from "./WagerSidebar";
import { MobileStoryRow } from "./MobileStoryRow";
import { ProofChatArea } from "./ProofChatArea";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  userId?: string;
  onOpenCamera?: (wagerId: string, hasUploadedToday?: boolean) => void;
  onUploadFile?: (wagerId: string, file: File) => void;
}

export function WagerChatLayout({ userId, onOpenCamera, onUploadFile }: LayoutProps = {}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { wagers, activeWager, handleVote, handleUpload, isLoading, isSyncing, hasUploadedToday } = useWagerChat(userId, activeId || undefined);

  // Initial setup: select first automatically on desktop if not mobile
  useEffect(() => {
    if (!activeId && wagers.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setActiveId(wagers[0].id);
    }
  }, [wagers, activeId]);

  if (isLoading && wagers.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-[2rem] border border-white/5">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#6366F1]/20 border-t-[#6366F1] rounded-full animate-spin"></div>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Showdowns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl relative md:mt-0">
      
      {/* Main Container - Responsive Behavior */}
      
      {/* 1. Sidebar View (Desktop & when null on Mobile) */}
      <div className={`w-full md:w-[35%] lg:w-[30%] flex flex-col border-r border-white/5 bg-slate-900 absolute md:relative inset-0 z-10 md:z-auto transition-transform duration-300 ${activeId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
        <MobileStoryRow wagers={wagers} onSelect={setActiveId} activeId={activeId} />
        
        <div className="p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 shrink-0">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-white tracking-wide">Challenges</h2>
        </div>

        <WagerSidebar wagers={wagers} onSelect={setActiveId} activeId={activeId} />
      </div>
      
      {/* 2. Main Chat Area (Desktop Always, Mobile if selected) */}
      <div className={`w-full md:w-[65%] lg:w-[70%] flex flex-col h-full bg-[#0F172A] absolute md:relative inset-0 z-20 md:z-auto transition-transform duration-300 ${activeId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        
        {/* Mobile Navbar for back button */}
        <div className="md:hidden flex items-center p-4 border-b border-white/5 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 shadow-md">
          <button 
            onClick={() => setActiveId(null)} 
            className="p-1 -ml-1 mr-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          {activeWager ? (
             <div className="flex items-center flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-white/10 shrink-0 mr-3">
                  <img src={activeWager.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-sm truncate">{activeWager.title}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{activeWager.participants.length} Participants</span>
                </div>
             </div>
          ) : (
            <span className="text-white font-bold">Chat</span>
          )}
        </div>

        {/* Desktop Navbar equivalent */}
        <div className="hidden md:flex items-center p-5 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
          {activeWager ? (
             <div className="flex items-center flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10 shrink-0 mr-4 shadow-lg">
                  <img src={activeWager.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-base truncate">{activeWager.title}</span>
                  <span className="text-xs text-[#6366F1] font-bold uppercase tracking-wider">{activeWager.participants.length} Participants</span>
                </div>
             </div>
          ) : (
             <span className="text-slate-400 font-bold">Inbox</span>
          )}
        </div>

        {/* Chat Area Content */}
        <div className="flex-1 overflow-hidden relative">
            <ProofChatArea 
             activeWager={activeWager} 
             onVote={handleVote} 
             onUpload={(e) => {
               const file = e.target.files?.[0];
               if (file && onUploadFile && activeWager) {
                 onUploadFile(activeWager.id, file);
               } else {
                 handleUpload();
               }
             }} 
             currentUserId={userId}
             hasUploadedToday={hasUploadedToday}
             isSyncing={isSyncing}
             onOpenCamera={() => {
               if (onOpenCamera && activeWager) {
                 onOpenCamera(activeWager.id, hasUploadedToday);
               } else {
                 handleUpload();
               }
             }}
           />
        </div>
        
      </div>

    </div>
  )
}
