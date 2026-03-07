export interface User {
  id: string;
  name: string;
  avatar: string;
  handle: string;
  walletAddress?: string;
}

export interface Participant {
  user: User;
  status: 'alive' | 'eliminated';
  stakedAmount: number;
}

export interface Wager {
  id: string;
  title: string;
  description: string;
  deadline: string;
  timeRemaining: string;
  participants: Participant[];
  totalStake: number;
  imageUrl?: string;
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

export interface ReliefRecipient {
  name: string;
  avatar: string;
  bio: string;
}

export interface ImpactClaim {
  id: string;
  amount: number;
  wagerTitle: string;
  reliefFund: string;
  recipient: ReliefRecipient;
  timestamp: string;
}

export interface PlatformStats {
  totalValueLocked: number;
  totalReliefPaid: number;
}
