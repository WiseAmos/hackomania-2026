import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckSquare } from "lucide-react";
import { ref, onValue, query, orderByChild, equalTo, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/appState";
import VotingPanel from "@/components/crisis/VotingPanel";
import BottomNavBar from "@/components/crisis/BottomNavBar";
import { SkeletonCard } from "@/components/ui/SkeletonLoader";
import type { Claim, VoteChoice } from "@/types";

function VotePage() {
  const { user, mode } = useAppStore();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, VoteChoice>>({});

  useEffect(() => {
    const q = query(
      ref(db, "claims"),
      orderByChild("status"),
      equalTo("voting")
    );

    const unsubscribe = onValue(q, (snap) => {
      const data: Claim[] = [];
      if (snap.exists()) {
        snap.forEach((childSnap) => {
          data.push({
            id: childSnap.key as string,
            ...(childSnap.val() as Omit<Claim, "id">),
          });
        });
      }
      setClaims(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleVote = async (claimId: string, choice: VoteChoice) => {
    if (!user) return;

    await push(ref(db, "votes"), {
      claimId,
      voterId: user.uid,
      choice,
      trustScoreAtVote: user.trustScore,
      createdAt: new Date().toISOString(),
    });

    setUserVotes((prev) => ({ ...prev, [claimId]: choice }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 pt-4 pb-4 border-b border-[var(--border)]">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-lg">
            Community Vote
          </h1>
          <p className="text-[var(--text-muted)] text-xs">
            {isLoading ? "Loading..." : `${claims.length} pending claim${claims.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-28">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <CheckSquare size={40} className="text-[var(--text-muted)]" />
            <p className="text-[var(--text-primary)] font-semibold">All caught up</p>
            <p className="text-[var(--text-muted)] text-sm">
              No claims currently in the voting queue.
            </p>
          </div>
        ) : (
          claims.map((claim) => (
            <VotingPanel
              key={claim.id}
              claim={claim}
              onVote={handleVote}
              hasVoted={claim.id in userVotes}
              userVote={userVotes[claim.id]}
            />
          ))
        )}
      </main>

      {mode === "crisis" && <BottomNavBar />}
    </div>
  );
}

export default VotePage;
