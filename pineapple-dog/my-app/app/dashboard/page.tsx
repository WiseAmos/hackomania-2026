"use client";

import { motion } from "framer-motion";
import { LogOut, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { useActiveShowdowns, useArenaFeed, useImpactPortfolio } from "../../hooks/useDashboardData";
import { ShowdownCarousel } from "../../components/dashboard/ShowdownCarousel";
import { ProofFeed } from "../../components/dashboard/ProofFeed";
import { ImpactSidebar } from "../../components/dashboard/ImpactSidebar";

// ----------------------------------------------------------------------
// Layout Root Setup
// ----------------------------------------------------------------------

export default function ArenaDashboardLayout() {
  const { wagers, isLoading: isLoadingWagers } = useActiveShowdowns();
  const { feed, isLoading: isLoadingFeed } = useArenaFeed();
  const { claims, stats, isLoading: isLoadingImpact } = useImpactPortfolio();

  return (
    <main className="min-h-screen bg-slate-900 relative pb-20 font-sans text-slate-100 selection:bg-[#6366F1]/30">
      
      {/* Background Ambient Glow */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_70%)] pointer-events-none z-0"></div>

      {/* Global Nav */}
      <nav className="w-full flex flex-col sm:flex-row justify-between items-center py-6 px-6 md:px-10 gap-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#FF4D4D] flex items-center justify-center font-[family-name:var(--font-heading)] font-bold shadow-[0_0_16px_rgba(99,102,241,0.3)] text-white">
            A
          </div>
          <div>
             <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight">Welcome, Alex</h1>
             <p className="text-slate-400 text-xs font-medium flex items-center gap-3">
                <Link href="/" className="hover:text-white transition-colors flex items-center gap-1"><LogOut className="w-3 h-3" /> Exit Arena</Link>
             </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-800 border border-white/10 rounded-full px-5 py-2 flex items-center gap-3 shadow-inner">
            <Wallet className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span className="font-bold text-sm text-[#06B6D4]">150.00 SGD</span>
          </div>
          <button className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-full font-[family-name:var(--font-heading)] font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_24px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:scale-95">
            <Plus className="w-4 h-4" />
            New Showdown
          </button>
        </div>
      </nav>

      {/* 
        Macro-Layout Responsive Grid Shell 
        Mobile: 1 Column | Desktop: 3 Columns [Main: 2] [Sidebar: 1]
      */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content Area (Spans 2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-8 w-full min-w-0">
             
             {/* 1. Top Section: Active Showdowns (Carousel) */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
             >
               <ShowdownCarousel isLoading={isLoadingWagers} wagers={wagers} />
             </motion.div>

             {/* 2. Center Stage: Proof Feed */}
             <div className="w-full">
               <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-white mb-4">
                  The Arena Feed
               </h2>
               <ProofFeed isLoading={isLoadingFeed} posts={feed} />
             </div>

          </div>

          {/* 3. Right Sidebar: Impact Portfolio */}
          <div className="lg:col-span-1 w-full lg:sticky lg:top-[120px]">
             <ImpactSidebar isLoading={isLoadingImpact} claims={claims} stats={stats} />
          </div>

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
