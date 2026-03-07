export interface User {
  id: string;
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
  status: 'alive' | 'eliminated';
  stakedAmount: number;
}

export interface Wager {
  id: string;
  title: string;
  description: string;
  deadline: string;
  timeRemaining: string;
  player1: Participant;
  player2: Participant;
  totalStake: number;
  status: 'active' | 'resolved' | 'awaiting_auth';
  winner?: string;
  grantId?: string;
  imageUrl?: string;
  createdAt?: string;
  // Compat: carousel still uses participants array
  participants?: Participant[];
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
