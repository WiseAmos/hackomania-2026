"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, HandCoins, Users, TrendingUp, ShieldCheck } from "lucide-react";
import { User } from "../../types/dashboard";
import { useState } from "react";

interface RaiseStakesModalProps {
  isOpen: boolean;
  onClose: () => void;
  wagerTitle: string;
  participants: User[];
}

export function RaiseStakesModal({ isOpen, onClose, wagerTitle, participants }: RaiseStakesModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("10");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRaise = () => {
    if (!selectedUserId) return;
    setIsProcessing(true);
    // Simulate smart contract interaction
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-0 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-white mb-1">Raise the Stakes</h3>
                <div className="text-[10px] font-bold text-[#6366F1] uppercase tracking-widest bg-[#6366F1]/10 px-2.5 py-1 rounded-full w-max">
                  {wagerTitle}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Select your backer
                </label>
                <div className="space-y-2">
                  {participants.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        selectedUserId === user.id 
                          ? "bg-[#6366F1]/10 border-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                          : "bg-slate-800/50 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center font-bold text-slate-900 shadow-lg">
                          {user.avatar}
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-white text-sm">{user.name}</div>
                          <div className="text-[10px] text-slate-500">{user.handle}</div>
                        </div>
                      </div>
                      {selectedUserId === user.id && (
                        <div className="w-5 h-5 rounded-full bg-[#6366F1] flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Stake Amount
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["10", "25", "50"].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                        amount === val 
                          ? "bg-[#10B981] border-[#10B981] text-slate-900 shadow-[0_4px_12px_rgba(16,185,129,0.3)]" 
                          : "bg-slate-800/50 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      S${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Note */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Staked funds are held in a transparent <span className="text-white font-bold">PineappleDog Smart Vault</span>. 
                  If your pick fails their challenge, your stake automatically funds verified global relief claims.
                </p>
              </div>

              {/* CTA */}
              <button 
                disabled={!selectedUserId || isProcessing}
                onClick={handleRaise}
                className="w-full h-14 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg shadow-xl shadow-[#6366F1]/20 flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95"
              >
                {isProcessing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <HandCoins className="w-6 h-6 mr-2" />
                    Commit S${amount}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
