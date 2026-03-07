/**
 * In-memory store for MVP.
 * In production this would be backed by a database.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StoredGrant {
    id: string;
    wagerId: string;
    participantId: string; // "player1" | "player2"
    walletUrl: string;
    amount: number; // in cents (assetScale=2)
    continueToken: string;
    continueUri: string;
    interactRef?: string;
    hash?: string;
    status: "pending" | "authorized" | "executed" | "cancelled" | "pool";
}

export interface WagerRecord {
    id: string;
    title: string;
    description: string;
    stakeAmount: number; // per player, in cents
    deadline: string;
    player1Wallet: string;
    player2Wallet: string;
    player1GrantId: string;
    player2GrantId: string;
    status: "awaiting_auth" | "active" | "resolved";
    winnerId?: string; // "player1" | "player2"
    createdAt: string;
}

export interface FundPoolEntry {
    id: string;
    grantId: string;
    sourceWagerId: string;
    amount: number; // in cents
    continueToken: string;
    continueUri: string;
    interactRef: string;
    walletUrl: string;
    status: "available" | "claimed";
}

// ─── In-Memory Storage ──────────────────────────────────────────────────────

const grants: StoredGrant[] = [];
const wagers: WagerRecord[] = [];
const fundPool: FundPoolEntry[] = [];

// ─── Grant Operations ───────────────────────────────────────────────────────

export function addGrant(grant: StoredGrant) {
    grants.push(grant);
}

export function getGrant(id: string): StoredGrant | undefined {
    return grants.find((g) => g.id === id);
}

export function getGrantsByWager(wagerId: string): StoredGrant[] {
    return grants.filter((g) => g.wagerId === wagerId);
}

export function updateGrant(id: string, updates: Partial<StoredGrant>) {
    const grant = grants.find((g) => g.id === id);
    if (grant) Object.assign(grant, updates);
}

// ─── Wager Operations ───────────────────────────────────────────────────────

export function addWager(wager: WagerRecord) {
    wagers.push(wager);
}

export function getWager(id: string): WagerRecord | undefined {
    return wagers.find((w) => w.id === id);
}

export function getAllWagers(): WagerRecord[] {
    return [...wagers];
}

export function updateWager(id: string, updates: Partial<WagerRecord>) {
    const wager = wagers.find((w) => w.id === id);
    if (wager) Object.assign(wager, updates);
}

// ─── Fund Pool Operations ───────────────────────────────────────────────────

export function addPoolGrant(entry: FundPoolEntry) {
    fundPool.push(entry);
}

export function getAvailablePoolGrants(): FundPoolEntry[] {
    return fundPool.filter((e) => e.status === "available");
}

export function getTotalPoolBalance(): number {
    return getAvailablePoolGrants().reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Smart grant assembly: finds the best combination of pool grants
 * to fulfill a claim amount. Returns the grants to use and any leftover.
 */
export function assembleGrantsForClaim(amountNeeded: number): {
    grants: FundPoolEntry[];
    totalAssembled: number;
    sufficient: boolean;
} {
    const available = getAvailablePoolGrants().sort((a, b) => b.amount - a.amount);
    const selected: FundPoolEntry[] = [];
    let total = 0;

    for (const entry of available) {
        if (total >= amountNeeded) break;
        selected.push(entry);
        total += entry.amount;
    }

    return {
        grants: selected,
        totalAssembled: total,
        sufficient: total >= amountNeeded,
    };
}
