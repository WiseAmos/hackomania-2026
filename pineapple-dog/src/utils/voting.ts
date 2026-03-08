import { PlatformStats, Wager } from '../../types/dashboard';

export function calculateVotingPower(
  userId: string,
  stats: PlatformStats,
  wagers: Wager[],
  numClaims: number
): number {
  let S_i = 0;
  wagers.forEach(wager => {
    if (wager.player1?.uid === userId) {
      S_i += wager.player1.stakedAmount || 0;
    } else if (wager.player2?.uid === userId) {
      S_i += wager.player2.stakedAmount || 0;
    }
  });

  const P = stats.totalValueLocked || 1;
  const baseline = 3;

  // Additional voting power is proportionate to the user's stake in the platform
  // ratio * 10 means if you own 10% of TVL, you get 1 extra vote.
  // We use ceil to ensure any stake gives at least 1 extra vote.
  const additionalPower = S_i > 0 ? Math.ceil((S_i / P) * numClaims) : 0;

  const totalPower = baseline + additionalPower;

  // Cap it reasonably at numClaims or baseline + something large
  return Math.min(totalPower, numClaims > 0 ? numClaims : baseline);
}

export const VOTE_THRESHOLD = 5;
