"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Plus, Wallet, Award, Loader2, User, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useActiveShowdowns, useArenaFeed, useImpactPortfolio } from "../../hooks/useDashboardData";
import { ProofSubmissionModal } from "../../components/dashboard/ProofSubmissionModal";
import { ProofFeed } from "../../components/dashboard/ProofFeed";
import { FriendsModal } from "../../components/dashboard/FriendsModal";
import { ImpactSection } from "../../components/dashboard/ImpactSection";
import { ChallengeCard } from "../../components/dashboard/ChallengeCard";
import { WagerChatLayout } from "../../components/dashboard/chat/WagerChatLayout";
import { RaiseStakesModal } from "../../components/dashboard/RaiseStakesModal";
import { ProofPost, Wager } from "../../types/dashboard";

// ----------------------------------------------------------------------
// Layout Root Setup
// ----------------------------------------------------------------------

export default function ArenaDashboardLayout() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"personal" | "arena" | "impact">("personal");

  // Redirect to login if not authenticated or onboarding if not complete
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (!user.onboardingComplete) {
        router.push("/onboarding");
      }
    }
  }, [user, loading, router]);

  const { globalWagers, myWagers, isLoading: isLoadingWagers } = useActiveShowdowns(user?.uid);
  const { feed, isLoading: isLoadingFeed } = useArenaFeed();
  const { claims, isLoading: isLoadingImpact } = useImpactPortfolio(user?.uid);

  // Modal states - moved before early returns to follow Rules of Hooks
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRaisingWager, setSelectedRaisingWager] = useState<Wager | null>(null);
  const [isProveModalOpen, setIsProveModalOpen] = useState(false);
  const [selectedWagerPrompt, setSelectedWagerPrompt] = useState<Wager | null>(null);
  const [selectedHasUploadedToday, setSelectedHasUploadedToday] = useState(false);
  const [selectedInitialFile, setSelectedInitialFile] = useState<File | null>(null);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      </main>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleOpenRaiseModal = (wager: Wager) => {
    setSelectedRaisingWager(wager);
    setIsModalOpen(true);
  };

  const handleOpenProveModal = (wager: Wager, hasUploaded?: boolean, file?: File) => {
    setSelectedWagerPrompt(wager);
    setSelectedHasUploadedToday(!!hasUploaded);
    setSelectedInitialFile(file || null);
    setIsProveModalOpen(true);
  };

  return (
    <main className={`min-h-screen bg-slate-900 relative font-sans text-slate-100 selection:bg-[#6366F1]/30 ${activeTab === "personal" ? "h-screen overflow-hidden" : "pb-20"}`}>

      {/* Background Ambient Glow */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_70%)] pointer-events-none z-0"></div>

      {/* Global Nav */}
      <nav className="w-full flex flex-col sm:flex-row justify-between py-6 px-6 md:px-10 gap-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link href="/profile" className="flex items-center gap-4 group cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#FF4D4D] flex items-center justify-center font-[family-name:var(--font-heading)] font-bold shadow-[0_0_16px_rgba(99,102,241,0.3)] text-white shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
              {user.avatar?.startsWith('http') ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.avatar || "A"
              )}
            </div>
            <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight">Welcome, {user.name}</h1>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/50 p-1 rounded-full border border-white/5">
            <button
              onClick={() => setActiveTab("personal")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "personal" ? "bg-[#6366F1] text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              My Wages
            </button>
            <button
              onClick={() => setActiveTab("arena")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "arena" ? "bg-[#6366F1] text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              Arena
            </button>
            <button
              onClick={() => setActiveTab("impact")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "impact" ? "bg-[#10B981] text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              Impact
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => setIsFriendsModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-full px-4 py-2.5 flex items-center gap-2 shadow-inner transition-colors"
          >
            <Users className="w-4 h-4 text-[#06B6D4]" />
            <span className="font-bold text-xs sm:text-sm text-[#06B6D4]">
              Friends
            </span>
          </button>
          <Link href="/profile" className="hidden md:flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-white/70 hover:text-white px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all border border-white/5">
            <User className="w-4 h-4" />
            Profile & KYC
          </Link>
          <Link href="/wager" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 sm:px-5 py-2.5 rounded-full font-[family-name:var(--font-heading)] font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-[0_0_24px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:scale-95 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            New Showdown
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold border border-transparent hover:border-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Body Area */}
      <div className={`mx-auto relative z-10 flex flex-col ${activeTab === "personal" ? "w-full max-w-full h-[calc(100vh-88px)]" : "max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 gap-4"}`}>

        {/* Content Heading (Contextual) */}
        <div>
          {activeTab === "arena" && (
            <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-white text-center">
              The Arena Feed
            </h2>
          )}
        </div>

        {/* Tab Content Rendering */}
        <div className={`${activeTab === "personal" ? "flex-1 min-h-0" : "min-h-[500px] pb-24"}`}>
          {activeTab === "personal" && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full"
            >
              <WagerChatLayout
                userId={user.uid}
                onOpenCamera={(wagerId, hasUploaded) => {
                  const wager = myWagers.find((w) => w.id === wagerId);
                  if (wager) {
                    handleOpenProveModal(wager, hasUploaded);
                  } else {
                    handleOpenProveModal({
                      id: wagerId,
                      title: "Current Showdown",
                      totalStake: 50,
                      timeRemaining: "12:00:00",
                    } as Wager, hasUploaded);
                  }
                }}
                onUploadFile={(wagerId, file) => {
                  const wager = myWagers.find((w) => w.id === wagerId);
                  if (wager) {
                    handleOpenProveModal(wager, false, file);
                  } else {
                    handleOpenProveModal({
                      id: wagerId,
                      title: "Current Showdown",
                      totalStake: 50,
                      timeRemaining: "12:00:00",
                    } as Wager, false, file);
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === "arena" && (
            <motion.div
              key="arena"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
            >
              <ProofFeed
                isLoading={isLoadingFeed}
                posts={feed}
                allWagers={globalWagers}
                onRaiseStakes={handleOpenRaiseModal}
              />
            </motion.div>
          )}

          {activeTab === "impact" && (
            <motion.div
              key="impact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
            >
              <ImpactSection isLoading={isLoadingImpact} claims={claims} />
            </motion.div>
          )}
        </div>

      </div>

      {/* Bottom Navigation Tab Bar (Mobile Only) */}
      <nav className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center justify-between shadow-2xl z-[60]">
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-full transition-all ${activeTab === "personal" ? "bg-[#6366F1] text-white" : "text-slate-400 hover:text-slate-200"}`}
        >
          <div className="p-1 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">My Wages</span>
        </button>

        <button
          onClick={() => setActiveTab("arena")}
          className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-full transition-all ${activeTab === "arena" ? "bg-[#6366F1] text-white" : "text-slate-400 hover:text-slate-200"}`}
        >
          <div className="p-1 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Arena</span>
        </button>

        <button
          onClick={() => setActiveTab("impact")}
          className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-full transition-all ${activeTab === "impact" ? "bg-[#10B981] text-white" : "text-slate-400 hover:text-[#10B981]/80"}`}
        >
          <div className="p-1 rounded-full">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Impact</span>
        </button>

        <Link 
          href="/profile"
          className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-full transition-all text-slate-400 hover:text-slate-200`}
        >
          <div className="p-1 rounded-full text-white/60">
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
        </Link>
      </nav>

      <RaiseStakesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wagerTitle={selectedRaisingWager?.title || ""}
        participants={selectedRaisingWager ? (
          selectedRaisingWager.participants || [selectedRaisingWager.player1, selectedRaisingWager.player2]
        ).filter(Boolean).map(p => ({
          id: p.uid,
          name: p.name,
          avatar: p.avatar,
          handle: p.handle,
        })) : []}
      />

      <ProofSubmissionModal
        isOpen={isProveModalOpen}
        onClose={() => {
          setIsProveModalOpen(false);
          setSelectedInitialFile(null);
        }}
        wager={selectedWagerPrompt}
        hasUploadedToday={selectedHasUploadedToday}
        initialFile={selectedInitialFile}
      />

      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        currentUserUid={user.uid}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

    </main>
  );
}
