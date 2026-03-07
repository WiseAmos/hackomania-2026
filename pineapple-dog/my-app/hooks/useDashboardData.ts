import { useState, useEffect } from "react";
import { Wager, ProofPost, ImpactClaim, PlatformStats } from "../types/dashboard";

function formatTimeRemaining(deadline: string): string {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m left`;
}

export function useActiveShowdowns(userId?: string) {
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const url = userId ? `/api/wagers?userId=${userId}` : "/api/wagers";
    fetch(url)
      .then((res) => res.json())
      .then((data: Wager[]) => {
        const enriched = (Array.isArray(data) ? data : []).map((w) => ({
          ...w,
          timeRemaining: formatTimeRemaining(w.deadline),
          // Build participants array for ShowdownCarousel compat
          participants: [
            { ...w.player1, user: { id: w.player1?.uid || "", name: w.player1?.name || "", avatar: w.player1?.avatar || "?", handle: w.player1?.handle || "" } },
            { ...w.player2, user: { id: w.player2?.uid || "", name: w.player2?.name || "", avatar: w.player2?.avatar || "?", handle: w.player2?.handle || "" } },
          ],
        }));
        setWagers(enriched);
      })
      .catch((err) => {
        console.error("Failed to fetch wagers:", err);
        setWagers([]);
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { wagers, isLoading };
}

export function useArenaFeed() {
  const [feed, setFeed] = useState<ProofPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proofs")
      .then((res) => res.json())
      .then((data) => {
        const posts = (Array.isArray(data) ? data : []).map((p: ProofPost) => ({
          ...p,
          timestamp: p.timestamp
            ? new Date(p.timestamp).toLocaleString()
            : "just now",
        }));
        setFeed(posts);
      })
      .catch((err) => {
        console.error("Failed to fetch feed:", err);
        setFeed([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { feed, isLoading };
}

export function useImpactPortfolio(userId?: string) {
  const [claims, setClaims] = useState<ImpactClaim[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const claimsUrl = userId ? `/api/claims?userId=${userId}` : "/api/claims";
    Promise.all([
      fetch(claimsUrl).then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ])
      .then(([claimsData, statsData]) => {
        setClaims(Array.isArray(claimsData) ? claimsData : []);
        setStats(statsData);
      })
      .catch((err) => {
        console.error("Failed to fetch impact:", err);
        setClaims([]);
        setStats({ totalValueLocked: 0, totalReliefPaid: 0 });
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { claims, stats, isLoading };
}
