"use client";

import { useState, useEffect } from "react";
import { Users, HandCoins, AlertCircle } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
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
  const { user } = useAuth();
  const [activeFeedTab, setActiveFeedTab] = useState<"friends" | "global">("friends");
  const [friends, setFriends] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.uid) {
      fetch(`/api/users/friends?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => setFriends(data || {}))
        .catch(err => console.error("Failed to load friends", err));
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-800 rounded-full animate-pulse mx-auto" />
        <div className="h-96 w-full bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const globalWagers = allWagers.filter(wager => {
    return wager.player1?.uid !== user?.uid && wager.player2?.uid !== user?.uid;
  });

  const friendsWagers = globalWagers.filter(wager => {
    return friends[wager.player1?.uid] || (wager.player2?.uid && friends[wager.player2?.uid]);
  });

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
          onClick={() => setActiveFeedTab("friends")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeFeedTab === "friends" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"}`}
        >
          Friends
          {friendsWagers.length > 0 && (
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{friendsWagers.length}</span>
          )}
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
          globalWagers.map((wager) => (
            <ChallengeCard
              key={wager.id}
              data={wager}
              onAction={(data) => onRaiseStakes(data as Wager)}
            />
          ))
        ) : friendsWagers.length > 0 ? (
          friendsWagers.map((wager) => (
            <ChallengeCard
              key={wager.id}
              data={wager}
              onAction={(data) => onRaiseStakes(data as Wager)}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-500 font-medium">None of your friends have wagers right now. Add some friends or check the Global feed!</p>
          </div>
        )}
      </div>
    </div>
  );
}
