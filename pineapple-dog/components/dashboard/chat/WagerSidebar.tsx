import { ChatWager } from "../../../types/chat";

interface Props {
  wagers: ChatWager[];
  onSelect: (id: string) => void;
  activeId: string | null;
  userId?: string;
}

export function WagerSidebar({ wagers, onSelect, activeId, userId }: Props) {
  const getStatusDot = (status: string) => {
    switch(status) {
      case 'red': return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";
      case 'yellow': return "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]";
      case 'green': return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]";
      default: return "bg-slate-500";
    }
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar py-2 shrink-0">
      {wagers.map(w => (
        <button 
          key={w.id} 
          onClick={() => onSelect(w.id)} 
          className={`w-full flex items-center gap-3 p-4 hover:bg-slate-800 transition-colors border-b border-white/5 ${activeId === w.id ? 'bg-slate-800 border-l-4 border-l-[#6366F1]' : 'border-l-4 border-l-transparent'}`}
        >
           <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-slate-700 border border-white/10 relative">
             <img src={w.imageUrl} className="w-full h-full object-cover" alt="" />
           </div>
           
            <div className="flex-1 min-w-0 text-left flex flex-col justify-center">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="text-[13px] md:text-sm font-bold text-white truncate">{w.title}</div>
                {w.dbStatus === 'resolved' && (
                  (() => {
                    const me = w.participants.find(p => p.id === userId);
                    if (me?.status === 'winner') return <span className="shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 uppercase">Win</span>;
                    if (me?.status === 'eliminated') return <span className="shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 uppercase">Lost</span>;
                    return null;
                  })()
                )}
              </div>
              <div className="text-[11px] md:text-xs text-slate-400 truncate mt-0.5 whitespace-nowrap overflow-hidden flex items-center gap-2">
                {w.dbStatus === 'resolved' ? (
                  <span className="flex items-center gap-1">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">Resolved</span>
                    {w.latestAction}
                  </span>
                ) : w.latestAction}
              </div>
            </div>
           
           <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusDot(w.status)}`} />
        </button>
      ))}
      {wagers.length === 0 && (
         <div className="p-6 text-center text-slate-500 text-sm">
           No active wagers found
         </div>
      )}
    </div>
  )
}
