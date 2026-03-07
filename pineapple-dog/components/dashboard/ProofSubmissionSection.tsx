"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, Ghost, Loader2, Sparkles, Trophy, Upload, X } from "lucide-react";
import { Wager } from "../../types/dashboard";

interface Props {
  isLoading: boolean;
  wagers: Wager[];
}

export function ProofSubmissionSection({ isLoading, wagers }: Props) {
  const [selectedWager, setSelectedWager] = useState<Wager | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'taking' | 'processing' | 'success'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-4">
        <div className="h-20 w-full bg-slate-800 animate-pulse rounded-3xl border border-white/5" />
        <div className="aspect-[3/4] w-full bg-slate-800 animate-pulse rounded-[3rem] border border-white/5" />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        setStatus('taking');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setCapturedImage(null);
        setSelectedWager(null);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      
      {/* Challenge Picker - BeReal Style Pills */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
          Select Active Challenge
        </label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {wagers.map((wager) => (
            <button
              key={wager.id}
              onClick={() => setSelectedWager(wager)}
              className={`shrink-0 px-5 py-3 rounded-2xl border transition-all flex flex-col gap-1 min-w-[140px] ${
                selectedWager?.id === wager.id
                  ? "bg-[#6366F1] border-[#6366F1] shadow-lg shadow-[#6366F1]/20 scale-[1.02]"
                  : "bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/10"
              }`}
            >
              <span className={`text-[10px] font-black uppercase ${selectedWager?.id === wager.id ? "text-white/80" : "text-slate-500"}`}>
                {wager.timeRemaining}
              </span>
              <span className={`text-xs font-bold truncate w-full ${selectedWager?.id === wager.id ? "text-white" : "text-slate-300"}`}>
                {wager.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main BeReal Frame */}
      <div className="relative aspect-[3/4] w-full bg-slate-950 rounded-[3rem] border-4 border-slate-800 overflow-hidden shadow-2xl group">
        
        <AnimatePresence mode="wait">
          {!selectedWager ? (
            <motion.div 
              key="no-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6 border border-white/5">
                <Ghost className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Time to be Real</h3>
              <p className="text-slate-500 text-sm">Select a challenge above to submit your proof of work.</p>
            </motion.div>
          ) : capturedImage ? (
            <motion.div 
              key="preview"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0"
            >
              <img src={capturedImage} className="w-full h-full object-cover" alt="Proof" />
              
              {/* BeReal Style Overlay */}
              <div className="absolute top-8 left-8">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                  <div className="text-[10px] font-black text-white/60 uppercase tracking-widest">PROVING</div>
                  <div className="text-sm font-bold text-white uppercase">{selectedWager.title}</div>
                </div>
              </div>

              {/* Success Overlay */}
              {status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-[#10B981]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-2xl">
                    <Trophy className="w-12 h-12 text-[#10B981]" />
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase italic mb-2 tracking-tighter">PROOF SENT</h2>
                  <p className="text-white/90 font-bold">Stakes Raised. Arena Notified.</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="camera-ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#020617_100%)]"
            >
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-[#6366F1]/10 border-2 border-dashed border-[#6366F1]/30 flex items-center justify-center mb-8 animate-[pulse_3s_infinite]">
                  <Camera className="w-10 h-10 text-[#6366F1]" />
                </div>
                <div className="text-center px-10">
                  <div className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">READY TO PROVE?</div>
                  <div className="text-slate-500 text-sm font-medium">Capture or upload your proof for the <span className="text-[#6366F1] font-bold">{selectedWager.title}</span>.</div>
                </div>
              </div>

              {/* Scanner Line */}
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366F1] to-transparent z-0 opacity-30 shadow-[0_0_15px_#6366F1]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls */}
        <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-center items-center gap-4 z-30">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
            capture="environment"
          />

          {!capturedImage && selectedWager && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-white border-8 border-white/20 flex items-center justify-center shadow-2xl transition-transform active:scale-90"
            >
              <div className="w-12 h-12 rounded-full border-4 border-slate-900"></div>
            </button>
          )}

          {capturedImage && status === 'taking' && (
            <div className="flex gap-4 w-full max-w-[280px]">
              <button 
                onClick={() => { setCapturedImage(null); setStatus('idle'); }}
                className="flex-1 h-14 bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" /> Retake
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 h-14 bg-[#10B981] text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
              >
                <Upload className="w-5 h-5" /> POST
              </button>
            </div>
          )}

          {status === 'processing' && (
            <div className="h-14 w-full max-w-[200px] bg-white text-slate-900 rounded-2xl font-black flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              VERIFYING...
            </div>
          )}
        </div>
      </div>

      {/* Footer Hint */}
      <div className="flex items-center justify-center gap-2 text-slate-500">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">
          Proof is verified by the community & smart contract AI
        </span>
      </div>

    </div>
  );
}
