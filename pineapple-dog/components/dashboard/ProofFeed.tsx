"use client";

import { useState } from "react";
import { Users, HandCoins, AlertCircle } from "lucide-react";
import { ProofPost, Wager } from "../../types/dashboard";
import { RaiseStakesModal } from "./RaiseStakesModal";
import { ChallengeCard } from "./ChallengeCard";

interface Props {
  isLoading: boolean;
  posts: ProofPost[];
  allWagers: Wager[];
  onRaiseStakes: (wager: Wager) => void;
}

export function ProofFeed({ isLoading, posts, allWagers, onRaiseStakes }: Props) {
  const [activeFeedTab, setActiveFeedTab] = useState<"following" | "trending" | "global">("global");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-800 rounded-full animate-pulse mx-auto" />
        <div className="h-96 w-full bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Simple filter logic for demonstration
  const filteredPosts = activeFeedTab === "following"
    ? posts
    : activeFeedTab === "trending"
      ? [...posts].sort((a, b) => b.verifications - a.verifications)
      : [...posts].reverse();

  // Zero State for new users
  if (posts.length === 0 && allWagers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-800 border border-white/5 rounded-3xl">
        <h3 className="text-xl font-[family-name:var(--font-heading)] font-bold text-white mb-2">It's Quiet Here...</h3>
        <p className="text-slate-400 mb-6">Join your first community showdown or invite friends to fill up your feed.</p>
        <button className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-3 rounded-full font-bold shadow-[0_0_24px_rgba(99,102,241,0.3)]">
          Explore Global Challenges
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">

      {/* Toggles */}
      <div className="flex bg-slate-800/50 p-1.5 rounded-full border border-white/5 w-max mx-auto mb-6">
        <button
          onClick={() => setActiveFeedTab("following")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeFeedTab === "following" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"}`}
        >
          Following
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{posts.length}</span>
        </button>
        <button
          onClick={() => setActiveFeedTab("trending")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeFeedTab === "trending" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"}`}
        >
          Trending
        </button>
        <button
          onClick={() => setActiveFeedTab("global")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeFeedTab === "global" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"}`}
        >
          Global
        </button>
      </div>

      {/* Posts Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 px-3 md:px-0">
        {activeFeedTab === "global" ? (
          allWagers.map((wager) => (
            <ChallengeCard
              key={wager.id}
              type="active-goal"
              data={wager}
              onAction={(data) => onRaiseStakes(data as Wager)}
            />
          ))
        ) : (
          filteredPosts.map((post) => (
            <ChallengeCard
              key={post.id}
              type="post"
              data={post}
              onAction={(data) => {
                const p = data as ProofPost;
                const w = allWagers.find((tw) => tw.id === p.wager.id);
                if (w) onRaiseStakes(w);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
