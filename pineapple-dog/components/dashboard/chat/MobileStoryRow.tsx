import { ChatWager } from "../../../types/chat";

interface Props {
  wagers: ChatWager[];
  onSelect: (id: string) => void;
  activeId: string | null;
}

export function MobileStoryRow({ wagers, onSelect, activeId }: Props) {
  const urgentWagers = wagers.filter(w => w.status === 'red' || w.status === 'yellow');
  
  if (urgentWagers.length === 0) return null;
  
  return (
    <div className="flex gap-4 p-4 overflow-x-auto border-b border-white/5 md:hidden no-scrollbar bg-slate-900 shrink-0">
      {urgentWagers.map(w => {
        const ringColor = w.status === 'red' ? 'ring-red-500' : 'ring-yellow-500';
        return (
          <button 
            key={w.id} 
            onClick={() => onSelect(w.id)} 
            className="flex flex-col items-center gap-1.5 shrink-0 group transition-transform hover:scale-105 active:scale-95"
          >
            <div className={`w-14 h-14 rounded-full p-0.5 ring-2 ring-offset-2 ring-offset-slate-900 ${ringColor} shadow-lg`} style={{ boxShadow: `0 0 15px var(--tw-ring-color)` }}>
              <img src={w.imageUrl} className="w-full h-full rounded-full object-cover border border-white/10" alt={w.title} />
            </div>
            <span className="text-[10px] text-slate-300 w-16 truncate text-center font-medium mt-1 group-hover:text-white transition-colors">{w.title}</span>
          </button>
        )
      })}
    </div>
  )
}
