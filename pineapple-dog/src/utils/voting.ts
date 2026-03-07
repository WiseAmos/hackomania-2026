import { Participant, PlatformStats, Wager } from '../../types/dashboard';

/**
 * Calculates the voting power for a participant using quadratic voting formula.
 *
 * Quadratic voting is a voting system where the cost of votes increases quadratically
 * with the number of votes cast. This prevents "whale dominance" where a single large
 * stakeholder can overpower smaller participants. The formula balances stake size (S_i)
 * with total platform liquidity (P) and active claims (C) to determine voting influence.
 *
 * Formula: V_i = floor( sqrt( (S_i * P) / (1 + C) ) )
 *
 * Where:
 * - S_i: Participant's staked amount
 * - P: Total value locked in the platform
 * - C: Number of active claims (wagers awaiting authorization)
 *
 * @param participant - The participant whose voting power is being calculated
 * @param stats - Platform statistics containing total value locked
 * @param allWagers - Array of all wagers to count active claims
 * @returns The calculated voting power as an integer
 */
export function calculateVotingPower(
  participant: Participant,
  stats: PlatformStats,
  allWagers: Wager[]
): number {
  const S_i = participant.stakedAmount;
  let P = stats.totalValueLocked;

  // Prevent division by zero: if total pool is 0, treat as 1
  if (P === 0) {
    P = 1;
  }

  const C = allWagers.filter(wager => wager.status === 'awaiting_auth').length;

  const votingPower = Math.sqrt((S_i * P) / (1 + C));

  return Math.floor(votingPower);
}