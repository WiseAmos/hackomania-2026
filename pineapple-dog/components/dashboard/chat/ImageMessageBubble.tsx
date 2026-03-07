import { ProofMessage } from "../../../types/chat";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

export function ImageMessageBubble({ message, onVote, currentUserId }: { message: ProofMessage; onVote: (id: string, v: boolean) => void; currentUserId?: string }) {
  const isMe = message.sender.id === 'me' || (currentUserId && message.sender.id === currentUserId);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`flex w-full mb-6 ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex flex-col max-w-[85%] md:max-w-xs lg:max-w-sm ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && (
          <div className="flex items-center gap-2 mb-1.5 ml-2">
            <img src={message.sender.avatar} className="w-5 h-5 rounded-full object-cover border border-white/5 bg-slate-700" alt="" />
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{message.sender.name}</span>
          </div>
        )}
        
        <div className={`p-1.5 rounded-[1.25rem] shadow-xl border border-white/10 ${isMe ? 'bg-[#6366F1]/20 border-[#6366F1]/30' : 'bg-slate-800'}`}>
          <img src={message.photoUrl} className="w-full rounded-[1rem] object-cover mb-2 max-h-80 border border-white/5" alt="Proof" />
          
          <div className="px-2 pb-1.5 flex flex-col gap-2">
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">
                Verified {message.verifiedCount}/{message.totalRequired}
              </span>
              <div className="flex gap-1 h-1.5 w-24 bg-slate-900 rounded-full overflow-hidden shadow-inner border border-white/5">
                <div 
                  className="bg-[#10B981] h-full transition-all duration-500 ease-out shadow-[0_0_10px_#10B981]" 
                  style={{ width: `${(message.verifiedCount / message.totalRequired) * 100}%` }} 
                />
              </div>
            </div>

            {!isMe && !message.hasVoted && (
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => onVote(message.id, true)} 
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-[#10B981]/15 text-[#10B981] font-bold text-xs hover:bg-[#10B981]/25 transition-all outline outline-1 outline-[#10B981]/20 active:scale-95 shadow-lg"
                >
                  <Check className="w-3.5 h-3.5" /> Valid
                </button>
                <button 
                  onClick={() => onVote(message.id, false)} 
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-red-500/15 text-red-500 font-bold text-xs hover:bg-red-500/25 transition-all outline outline-1 outline-red-500/20 active:scale-95 shadow-lg"
                >
                  <X className="w-3.5 h-3.5" /> BS
                </button>
              </div>
            )}
            
            {(!isMe && message.hasVoted) && (
              <div className="mt-1 text-center text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 py-1.5 rounded-xl border border-[#10B981]/20">
                You Voted
              </div>
            )}
          </div>

        </div>
        <span className="text-[9px] text-slate-500 mt-1 mx-2 font-bold uppercase tracking-wider">
          {new Date(message.timestamp).toLocaleTimeString([], {timeStyle: 'short'})}
        </span>
      </div>
    </motion.div>
  )
}
