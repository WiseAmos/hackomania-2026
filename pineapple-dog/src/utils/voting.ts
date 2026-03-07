import { Participant, PlatformStats, Wager } from '../../types/dashboard';

const TOTAL_SUPPLY = 10000;

export function calculateVotingPower(
  userId: string,
  stats: PlatformStats,
  wagers: Wager[]
): number {
  let S_i = 0;
  wagers.forEach(wager => {
    if (wager.player1.uid === userId) {
      S_i += wager.player1.stakedAmount || 0;
    } else if (wager.player2?.uid === userId) {
      S_i += wager.player2.stakedAmount || 0;
    }
  });

  const P = stats.totalValueLocked || 1; // Prevent division by zero
  const C = wagers.filter(wager => wager.status === 'awaiting_auth').length;

  // Formula: Vi = floor( sqrt( (Si / P) * (Total Supply / (1 + C)) ) )
  return Math.floor(Math.sqrt((S_i / P) * (TOTAL_SUPPLY / (1 + C))));
}
