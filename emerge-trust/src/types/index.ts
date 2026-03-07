// ─── App Mode ────────────────────────────────────────────────────────────────

export type AppMode = "peacetime" | "crisis";

// ─── Disaster / Oracle ───────────────────────────────────────────────────────

export type DisasterStatus = "inactive" | "active" | "resolved";

export interface DisasterZone {
  id: string;
  name: string;
  geofence: GeoPoint[];
  status: DisasterStatus;
  activatedAt: string | null;
  resolvedAt: string | null;
  newsKeywords: string[];
  sensorThreshold: number;
  currentSensorLevel: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

// ─── User / Trust ─────────────────────────────────────────────────────────────

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  walletAddress: string | null;
  trustScore: number;
  isVolunteerLeader: boolean;
  isBlacklisted: boolean;
  createdAt: string;
}

// ─── Wager / Commitment Contract ─────────────────────────────────────────────

export type WagerStatus = "locked" | "success" | "failed" | "streaming";

export interface Wager {
  id: string;
  userId: string;
  amount: number;
  assetCode: string;
  assetScale: number;
  status: WagerStatus;
  goalDescription: string;
  deadlineAt: string;
  createdAt: string;
  streamedAmount: number;
  grantContinueToken: string | null;
  grantContinueUri: string | null;
  outgoingPaymentGrantToken: string | null;
}

// ─── Claims ───────────────────────────────────────────────────────────────────

export type ClaimType = "individual" | "aggregated";
export type ClaimStatus =
  | "pending"
  | "tier1_paid"
  | "voting"
  | "tier2_paid"
  | "rejected"
  | "fraudulent";

export interface Claim {
  id: string;
  type: ClaimType;
  userId: string;
  zoneId: string;
  status: ClaimStatus;
  requestedAmount: number;
  tier1Amount: number;
  tier2Amount: number;
  photoUrl: string | null;
  geoLocation: GeoPoint | null;
  proofOfDistributionUrl: string | null;
  votingDeadlineAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Voting ───────────────────────────────────────────────────────────────────

export type VoteChoice = "approve" | "reject";

export interface Vote {
  id: string;
  claimId: string;
  voterId: string;
  choice: VoteChoice;
  trustScoreAtVote: number;
  createdAt: string;
}

export interface VotingResult {
  claimId: string;
  totalApprove: number;
  totalReject: number;
  weightedApprove: number;
  weightedReject: number;
  outcome: "approved" | "rejected" | "pending";
}

// ─── Community Vault ──────────────────────────────────────────────────────────

export interface CommunityVault {
  id: string;
  totalBalance: number;
  assetCode: string;
  assetScale: number;
  walletAddress: string;
  totalStreamed: number;
  totalPaidOut: number;
}

// ─── Open Payments / ILP ─────────────────────────────────────────────────────

export interface GrantRequestPayload {
  uid: string;
  senderWalletId: string;
  receiverWalletId: string;
  amount: string;
  assetCode: string;
}

export interface GrantResponse {
  grantUrl: string;
  continueToken: string;
  continueUri: string;
}

// ─── Admin / Simulation ──────────────────────────────────────────────────────

export interface SimulationConfig {
  oracleZoneId: string;
  oracleKeyword: string;
  wagerFailCount: number;
  timeTravelVotingClaimId: string;
}

// ─── Offline / PWA ───────────────────────────────────────────────────────────

export interface OfflineClaim {
  localId: string;
  claim: Omit<Claim, "id" | "status" | "createdAt" | "updatedAt">;
  savedAt: string;
  synced: boolean;
}
