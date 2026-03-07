"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Ghost, Loader2, Sparkles, Trophy, Upload, X } from "lucide-react";
import { Wager } from "../../types/dashboard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wager: Wager | null;
}

export function ProofSubmissionModal({ isOpen, onClose, wager }: Props) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'taking' | 'processing' | 'success'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setStatus('taking');
        stopCamera();
      }
    }
  };

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
        onClose();
      }, 3000);
    }, 2000);
  };

  if (!wager) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-center z-50">
               <div>
                 <div className="text-[10px] font-black text-[#6366F1] uppercase tracking-[0.2em] mb-1">PROVING CHALLENGE</div>
                 <h3 className="text-xl font-black text-white truncate max-w-[240px]">{wager.title}</h3>
               </div>
               <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
               >
                 <X className="w-6 h-6 text-slate-400" />
               </button>
            </div>

            {/* BeReal Frame */}
            <div className="flex-1 px-4 pb-4">
              <div className="relative h-full w-full bg-slate-950 rounded-[2.5rem] border-2 border-slate-800 overflow-hidden shadow-inner flex flex-col">
                
                <AnimatePresence mode="wait">
                  {capturedImage ? (
                    <motion.div 
                      key="preview"
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0"
                    >
                      <img src={capturedImage} className="w-full h-full object-cover" alt="Proof" />
                      
                      {/* BeReal Style Overlay */}
                      <div className="absolute top-6 left-6">
                        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5">
                          <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">BE REAL</div>
                          <div className="text-xs font-bold text-white uppercase italic">{wager.title}</div>
                        </div>
                      </div>

                      {/* Success Overlay */}
                      {status === 'success' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-[#10B981]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                        >
                          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-2xl">
                            <Trophy className="w-10 h-10 text-[#10B981]" />
                          </div>
                          <h2 className="text-2xl font-black text-white uppercase italic mb-1 tracking-tighter">PROOF RECORDED</h2>
                          <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Awaiting Verification</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="camera-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden"
                    >
                      {stream ? (
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin mb-4" />
                          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center px-10">
                            INITIALIZING LENS...
                          </div>
                        </div>
                      )}

                      {/* Scanner Line */}
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[1px] bg-[#6366F1]/50 z-20 shadow-[0_0_15px_#6366F1]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Stats Insight */}
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5">
                    <div className="text-[8px] font-black text-white/40 uppercase mb-1">POTENTIAL PAYOUT</div>
                    <div className="text-sm font-black text-[#10B981]">S${wager.totalStake}</div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 text-right">
                    <div className="text-[8px] font-black text-white/40 uppercase mb-1">DEADLINE</div>
                    <div className="text-sm font-black text-[#FF4D4D]">{wager.timeRemaining}</div>
                  </div>
                </div>

                {/* Shutter Controls */}
                <div className="absolute bottom-10 left-0 right-0 p-8 flex justify-center items-center z-50">
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {!capturedImage && (
                    <button 
                      onClick={capturePhoto}
                      disabled={!stream}
                      className="w-16 h-16 rounded-full bg-white border-4 border-white/20 flex items-center justify-center shadow-2xl active:scale-90 transition-transform disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full border-2 border-slate-900"></div>
                    </button>
                  )}

                  {capturedImage && status === 'taking' && (
                    <div className="flex gap-3 w-full max-w-[240px]">
                      <button 
                        onClick={() => { setCapturedImage(null); setStatus('idle'); }}
                        className="flex-1 h-12 bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white rounded-xl font-bold text-xs"
                      >
                        RETAKE
                      </button>
                      <button 
                        onClick={handleSubmit}
                        className="flex-1 h-12 bg-[#10B981] text-slate-900 rounded-xl font-black text-xs shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" /> SUBMIT
                      </button>
                    </div>
                  )}

                  {status === 'processing' && (
                    <div className="h-12 px-6 bg-white text-slate-900 rounded-xl font-black flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      SECURE UPLOAD...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hint */}
            <div className="p-6 pt-2 flex items-center justify-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
               <Sparkles className="w-3 h-3 text-amber-500" />
               Your proof will be verified by the community
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
