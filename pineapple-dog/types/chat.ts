export type ChatStatus = 'red' | 'yellow' | 'green';

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
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
  title: string;
  imageUrl: string;
  status: ChatStatus;
  latestAction: string;
  messages: ChatMessage[];
  participants: ChatUser[];
}
