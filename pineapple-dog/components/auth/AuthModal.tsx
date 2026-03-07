"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db, googleProvider } from "../../lib/firebase";
import { GoogleIcon } from "../icons/GoogleIcon";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"google" | "email" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const writeUserProfile = async (uid: string, name: string, emailAddr: string, photoUrl?: string | null) => {
    const userRef = ref(db, `users/${uid}`);
    const snap = await get(userRef);
    if (!snap.exists()) {
      await set(userRef, {
        name,
        email: emailAddr,
        avatar: photoUrl || name.charAt(0).toUpperCase(),
        handle: `@${name.toLowerCase().replace(/\s+/g, "")}`,
        walletAddress: "",
        onboardingComplete: false,
        kycVerified: false,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthMethod("google");
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await writeUserProfile(user.uid, user.displayName || "User", user.email || "", user.photoURL);
      onClose();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setAuthMethod("email");
    setError(null);

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await writeUserProfile(result.user.uid, email.split("@")[0], email);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await writeUserProfile(result.user.uid, email.split("@")[0], email);
      }
      onClose();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-md"
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-[420px] bg-[#1E293B] border border-white/10 rounded-[28px] shadow-[0_32px_64px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Loading Accent Bar */}
            {isLoading && (
              <motion.div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366F1] to-[#10B981] z-50 origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1, 0], translateX: ["0%", "0%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {/* Modal Header */}
            <div className="flex justify-end pt-4 pr-4 relative z-10">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-white/40 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-8 pb-10">
              <div className="text-center mb-8">
                <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white mb-3 tracking-tight">
                  Welcome to the Arena
                </h2>
                <p className="text-white/60 text-[15px] leading-relaxed max-w-[300px] mx-auto">
                  Back yourself. Back the world.<br className="hidden sm:block" />
                  Secure verification and seamless non-custodial wallet creation handled automatically.
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full relative flex items-center justify-center gap-3 bg-white text-gray-900 h-14 rounded-xl font-[family-name:var(--font-heading)] font-semibold text-base transition-all duration-300 hover:bg-gray-100 hover:scale-[1.02] focus:ring-4 focus:ring-white/20 disabled:scale-100 disabled:opacity-80 disabled:cursor-not-allowed group active:scale-95 shadow-[0_8px_16px_rgba(255,255,255,0.05)]"
                >
                  {isLoading && authMethod === "google" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-6 h-6 text-[#6366F1]" />
                    </motion.div>
                  ) : (
                    <>
                      <GoogleIcon className="w-[22px] h-[22px]" />
                      Continue with Google
                    </>
                  )}
                </button>

                <div className="flex items-center gap-4 py-3">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-white/30 text-[11px] font-bold uppercase tracking-widest px-1">Or</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full bg-[#0F172A]/50 border border-white/10 rounded-xl px-5 h-14 text-white placeholder-white/40 focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/50 focus:bg-[#0F172A] transition-all disabled:opacity-50 font-medium"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full bg-[#0F172A]/50 border border-white/10 rounded-xl px-5 h-14 text-white placeholder-white/40 focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/50 focus:bg-[#0F172A] transition-all disabled:opacity-50 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-transparent border border-white/10 text-white/80 h-14 rounded-xl font-[family-name:var(--font-heading)] font-semibold text-[15px] transition-all hover:bg-white/5 hover:border-white/20 focus:ring-4 focus:ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isLoading && authMethod === "email" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-5 h-5 text-white/50" />
                      </motion.div>
                    ) : (
                      <>
                        {isSignUp ? "Create Account" : "Sign In"}
                        <ArrowRight className="w-4 h-4 opacity-50" />
                      </>
                    )}
                  </button>
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError(null);
                      }}
                      className="text-white/40 hover:text-[#6366F1] transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      {isSignUp ? "Already have an account? Sign In" : "New here? Create an Account"}
                    </button>
                  </div>
                </form>
              </div>

              {/* TOS Agreement Footer */}
              <p className="mt-8 text-center text-[11px] text-white/40 leading-[1.6] px-4">
                By continuing, you acknowledge that you have read and agree to our <a href="#" className="underline hover:text-white/80 transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-white/80 transition-colors">Privacy Policy</a>.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
