import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ref, onValue, query, orderByChild, equalTo, push, set } from "firebase/database";
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

  // Handle Open Payments ILP Redirect Callback
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const interactRef = params.get("interact_ref");
    const hash = params.get("hash");

    if (interactRef && hash) {
      const pendingStr = sessionStorage.getItem("pendingWager");
      if (pendingStr) {
        setIsLoading(true);
        const completeInterledger = async () => {
          try {
            const parsed = JSON.parse(pendingStr);

            // 1. Send interactRef to backend
            await fetch(`/api/transaction/interact`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid: user.uid,
                interact_ref: interactRef,
                hash,
              }),
            });

            // 2. Create wager document in RTDB
            const wagerRef = push(ref(db, "wagers"));
            await set(wagerRef, {
              userId: user.uid,
              goalDescription: parsed.goal,
              amount: Math.round(parsed.amount * 100), // store in cents (assetScale=2)
              assetCode: "SGD",
              assetScale: 2,
              deadline: parsed.deadline,
              deadlineAt: new Date(parsed.deadline).toISOString(),
              walletId: parsed.walletId,
              status: "locked",
              streamedAmount: 0,
              grantContinueToken: null,
              grantContinueUri: null,
              outgoingPaymentGrantToken: null,
              createdAt: new Date().toISOString(),
            });

            // 3. Clean up
            sessionStorage.removeItem("pendingWager");
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (e) {
            console.error("Failed to complete wager lock", e);
          } finally {
            setIsLoading(false);
          }
        };

        completeInterledger();
      }
    }
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
