import { PlatformStats, Wager } from '../../types/dashboard';

export function calculateVotingPower(
  userId: string,
  stats: PlatformStats,
  wagers: Wager[],
  numClaims: number
): number {
  let S_i = 0;
  wagers.forEach(wager => {
    if (wager.player1.uid === userId) {
      S_i += wager.player1.stakedAmount || 0;
    } else if (wager.player2?.uid === userId) {
      S_i += wager.player2.stakedAmount || 0;
    }
  });

  const P = stats.totalValueLocked || 1;

  // Total available votes is proportionate to the user's stake in the platform
  // We use ceil to ensure that even small stakeholders get at least 1 vote if the ratio is positive.
  const ratio = S_i / P;

  // Voting power should be at least 1 if you have any stake and there are claims, 
  // but capped at the total number of claims available.
  const power = Math.ceil(ratio * numClaims);
  console.log(Math.min(power, numClaims))
  return Math.min(power, numClaims);
}
