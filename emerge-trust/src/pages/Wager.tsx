import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/appState";
import CommitmentLock from "@/components/peacetime/CommitmentLock";
import WagerCard from "@/components/peacetime/WagerCard";
import { SkeletonCard } from "@/components/ui/SkeletonLoader";
import type { Wager } from "@/types";

function WagerPage() {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const wagersRef = query(
      ref(db, "wagers"),
      orderByChild("userId"),
      equalTo(user.uid)
    );

    const unsubscribe = onValue(wagersRef, (snap) => {
      if (!snap.exists()) {
        setWagers([]);
        setIsLoading(false);
        return;
      }
      const data: Wager[] = [];
      snap.forEach((childSnap) => {
        data.push({
          id: childSnap.key as string,
          ...(childSnap.val() as Omit<Wager, "id">),
        });
      });
      setWagers(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 pt-safe pb-4 pt-4 border-b border-[var(--border)]">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[var(--surface)] flex items-center justify-center text-pt-muted hover:text-pt-text transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-pt-text font-bold text-lg">My Wagers</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-24">
        <CommitmentLock onLocked={() => navigate("/")} />

        <div className="space-y-3">
          <h2 className="text-pt-muted text-xs uppercase tracking-wider px-1">
            Active Commitments
          </h2>
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : wagers.length === 0 ? (
            <p className="text-pt-muted text-sm text-center py-8">
              No wagers yet. Lock your first commitment above.
            </p>
          ) : (
            wagers.map((wager) => <WagerCard key={wager.id} wager={wager} />)
          )}
        </div>
      </main>
    </div>
  );
}

export default WagerPage;
