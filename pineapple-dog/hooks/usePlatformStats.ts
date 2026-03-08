import { useState, useEffect } from "react";
import { PlatformStats } from "../types/dashboard";

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch platform stats:", err);
      setStats({ totalValueLocked: 0, totalReliefPaid: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, isLoading, refresh: fetchStats };
}
