export interface User {
  id: string;
  uid?: string; // added to match API output
  name: string;
  avatar: string;
  handle: string;
  walletAddress?: string;
  firstName?: string;
  lastName?: string;
  identification?: string;
  homeAddress?: string;
  householdIncome?: string;
  dob?: string;
  interledgerLink?: string;
  kycVerified?: boolean;
  identityDocUrl?: string;
  onboardingComplete?: boolean;
}

export interface Participant {
  uid: string;
  name: string;
  avatar: string;
  handle: string;
  walletAddress?: string;
  grantId?: string;        // Per-player grant ID (ILP authorization)
  status: 'alive' | 'eliminated' | 'winner';
  stakedAmount: number;
  joinedAt?: string;
}

export interface Wager {
  id: string;
  title: string;
  description: string;
  deadline: string;
  timeRemaining: string;
  poolExpiry?: string;
  participants: Participant[];
  totalStake: number;
  status: 'active' | 'resolved' | 'expired' | 'awaiting_auth';
  winner?: string;
  winners?: string[];
  /** @deprecated Use participant.grantId instead */
  grantId?: string;
  imageUrl?: string;
  createdAt?: string;
  stakeAmount: number;
  type: 'competitive' | 'personal' | 'global';
  isStreak?: boolean;
  // Legacy compat
  player1?: Participant;
  player2?: Participant;
}

export interface ProofPost {
  id: string;
  user: User;
  wager: Pick<Wager, 'id' | 'title'>;
  photoUrl: string;
  caption: string;
  timestamp: string;
  verifications: number;
  rejections: number;
}

export interface Recipient {
  name: string;
  avatar: string;
  bio: string;
}

export interface ImpactClaim {
  id: string;
  amount: number;
  wagerTitle: string;
  reliefFund: string;
  recipient: Recipient;
  timestamp: string;
  status?: string;
}

export interface PlatformStats {
  totalValueLocked: number;
  totalReliefPaid: number;
}
