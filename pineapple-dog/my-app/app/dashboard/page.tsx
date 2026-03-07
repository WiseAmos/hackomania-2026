"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Plus, Wallet, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useActiveShowdowns, useArenaFeed, useImpactPortfolio } from "../../hooks/useDashboardData";
import { ShowdownCarousel } from "../../components/dashboard/ShowdownCarousel";
import { ProofFeed } from "../../components/dashboard/ProofFeed";
import { ImpactSection } from "../../components/dashboard/ImpactSection";

export default function ArenaDashboardLayout() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"personal" | "arena" | "impact">("personal");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const { wagers, isLoading: isLoadingWagers } = useActiveShowdowns(user?.uid);
  const { feed, isLoading: isLoadingFeed } = useArenaFeed();
  const { claims, isLoading: isLoadingImpact } = useImpactPortfolio(user?.uid);

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

  return (
    <main className="min-h-screen bg-slate-900 relative pb-20 font-sans text-slate-100 selection:bg-[#6366F1]/30">

      {/* Background Ambient Glow */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_70%)] pointer-events-none z-0"></div>

      {/* Global Nav */}
      <nav className="w-full flex flex-col sm:flex-row justify-between items-center py-6 px-6 md:px-10 gap-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#FF4D4D] flex items-center justify-center font-[family-name:var(--font-heading)] font-bold shadow-[0_0_16px_rgba(99,102,241,0.3)] text-white">
            {user.avatar}
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight">Welcome, {user.name}</h1>
            <p className="text-slate-400 text-xs font-medium flex items-center gap-3">
              <button onClick={handleSignOut} className="hover:text-white transition-colors flex items-center gap-1">
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-white/10 rounded-full px-5 py-2 flex items-center gap-3 shadow-inner">
            <Wallet className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span className="font-bold text-sm text-[#06B6D4]">{user.walletAddress ? "Connected" : "No Wallet"}</span>
          </div>
          <Link href="/wager" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-full font-[family-name:var(--font-heading)] font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_24px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:scale-95">
            <Plus className="w-4 h-4" />
            New Showdown
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-8">

        {/* Rectangular Navigation Tabs */}
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-800/80 p-1.5 rounded-full border border-white/5 w-full max-w-2xl mx-auto shadow-xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex-1 min-w-[max-content] py-3 px-5 sm:px-6 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === "personal" ? "bg-slate-700 text-white shadow-md border border-white/5" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
          >
            My Showdowns
          </button>
          <button
            onClick={() => setActiveTab("arena")}
            className={`flex-1 min-w-[max-content] py-3 px-5 sm:px-6 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === "arena" ? "bg-slate-700 text-white shadow-md border border-white/5" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
          >
            Global Arena
          </button>
          <button
            onClick={() => setActiveTab("impact")}
            className={`flex-1 min-w-[max-content] py-3 px-5 sm:px-6 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === "impact" ? "bg-[#10B981]/15 text-[#10B981] shadow-md border border-[#10B981]/20" : "text-slate-400 hover:text-[#10B981] hover:bg-[#10B981]/5"}`}
          >
            My Impact Portfolio
          </button>
        </div>

        {/* Tab Content Rendering */}
        <div className="mt-2 min-h-[500px]">
          {activeTab === "personal" && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full flex flex-col gap-6"
            >
              <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-white text-center mb-2">
                Your Active Goals
              </h2>
              <ShowdownCarousel isLoading={isLoadingWagers} wagers={wagers} />
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
              <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-white mb-6 text-center">
                The Arena Feed
              </h2>
              <ProofFeed isLoading={isLoadingFeed} posts={feed} />
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
