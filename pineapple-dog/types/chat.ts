export type ChatStatus = 'red' | 'yellow' | 'green';

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  grantId?: string | null;
}

export interface ProofMessage {
  id: string;
  type: 'proof';
  sender: ChatUser;
  photoUrl: string;
  timestamp: string;
  verifiedCount: number;
  totalRequired: number;
  hasVoted?: boolean;
}

export interface SystemMessage {
  id: string;
  type: 'system';
  text: string;
  timestamp: string;
}

export type ChatMessage = ProofMessage | SystemMessage;

export interface ChatWager {
  id: string;
  wagerId: string;
  title: string;
  imageUrl: string;
  status: ChatStatus;
  latestAction: string;
  messages: ChatMessage[];
  participants: ChatUser[];
  isStreak?: boolean;
  dbStatus?: string;
  // Grant tracking per-player
  myGrantId: string | null;
  needsGrant: boolean;
  stakeAmount: number;
}
