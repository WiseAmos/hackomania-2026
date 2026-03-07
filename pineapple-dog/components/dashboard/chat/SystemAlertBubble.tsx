import { SystemMessage } from "../../../types/chat";
import { AlertTriangle } from "lucide-react";

export function SystemAlertBubble({ message }: { message: SystemMessage }) {
  return (
    <div className="my-6 flex justify-center w-full px-4">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-sm text-center shadow-lg">
        <div className="flex items-start justify-center gap-2">
          {message.text.includes('🚨') ? (
             <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          ) : null}
          <p className="text-xs font-semibold text-red-400 leading-relaxed">
            {message.text.replace('🚨', '').trim()}
          </p>
        </div>
        <span className="text-[9px] text-slate-500 mt-2 block uppercase tracking-wider font-bold">
          {new Date(message.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </div>
    </div>
  )
}
