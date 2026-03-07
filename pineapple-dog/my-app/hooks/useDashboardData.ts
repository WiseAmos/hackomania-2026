import { useState, useEffect } from "react";
import { Wager, ProofPost, ImpactClaim, PlatformStats } from "../types/dashboard";

const MOCK_WAGERS: Wager[] = [
  {
    id: "w1",
    title: "First to blink loses: 10k Daily Run",
    description: "Run 10km every day for a month.",
    deadline: "2026-03-10",
    timeRemaining: "3 hours left",
    totalStake: 100,
    participants: [
      { user: { id: "u1", name: "Alex", avatar: "A", handle: "@alexrun" }, status: "alive", stakedAmount: 50 },
      { user: { id: "u2", name: "Sarah", avatar: "S", handle: "@sarahfit" }, status: "eliminated", stakedAmount: 50 }
    ]
  },
  {
    id: "w2",
    title: "No Sugar Challenge",
    description: "Zero refined sugar for 14 days",
    deadline: "2026-03-24",
    timeRemaining: "4 days left",
    totalStake: 200,
    participants: [
      { user: { id: "u1", name: "Alex", avatar: "A", handle: "@alexrun" }, status: "alive", stakedAmount: 100 },
      { user: { id: "u3", name: "Mike", avatar: "M", handle: "@mikenotmike" }, status: "alive", stakedAmount: 100 }
    ]
  }
];

const MOCK_PROOFS: ProofPost[] = [
  {
    id: "p1",
    user: { id: "u3", name: "Mike", avatar: "M", handle: "@mikenotmike" },
    wager: { id: "w2", title: "No Sugar Challenge" },
    photoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    caption: "Salad day 4. Send help. 🥗",
    timestamp: "2 mins ago",
    verifications: 12,
    rejections: 1
  },
  {
    id: "p2",
    user: { id: "u4", name: "Elena", avatar: "E", handle: "@elenacodes" },
    wager: { id: "w3", title: "Ship a side project in 48hrs" },
    photoUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
    caption: "Backend deployed! Taking a redbull break.",
    timestamp: "1 hour ago",
    verifications: 45,
    rejections: 0
  }
];

const MOCK_IMPACT_CLAIMS: ImpactClaim[] = [
  {
    id: "ic1",
    amount: 50,
    wagerTitle: "No Sugar Challenge",
    reliefFund: "Pacific Wildfire Relief",
    recipient: {
      name: "Maria Silva",
      avatar: "M",
      bio: "Recovering from the wildfires. Funding used for temporary housing."
    },
    timestamp: "2 days ago"
  },
  {
    id: "ic2",
    amount: 120,
    wagerTitle: "10k Daily Run",
    reliefFund: "Earthquake Mutual Aid",
    recipient: {
      name: "Ahmed Hassan",
      avatar: "A",
      bio: "Rebuilding family bakery after the earthquake."
    },
    timestamp: "1 week ago"
  }
];

const MOCK_PLATFORM_STATS: PlatformStats = {
  totalValueLocked: 1250000,
  totalReliefPaid: 450000
};

export function useActiveShowdowns() {
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWagers(MOCK_WAGERS);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return { wagers, isLoading };
}

export function useArenaFeed() {
  const [feed, setFeed] = useState<ProofPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFeed(MOCK_PROOFS);
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return { feed, isLoading };
}

export function useImpactPortfolio() {
  const [claims, setClaims] = useState<ImpactClaim[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Toggle this constant to test empty vs populated states
  const HAS_LOST_MONEY = true;

  useEffect(() => {
    const timer = setTimeout(() => {
      setClaims(HAS_LOST_MONEY ? MOCK_IMPACT_CLAIMS : []);
      setStats(MOCK_PLATFORM_STATS);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { claims, stats, isLoading };
}
