import { openDB, type IDBPDatabase } from "idb";
import type { OfflineClaim } from "@/types";

const DB_NAME = "emerge-trust-offline";
const DB_VERSION = 1;
const CLAIMS_STORE = "offline-claims";

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CLAIMS_STORE)) {
        const store = db.createObjectStore(CLAIMS_STORE, {
          keyPath: "localId",
        });
        store.createIndex("synced", "synced");
        store.createIndex("savedAt", "savedAt");
      }
    },
  });

  return dbInstance;
}

export async function saveClaimOffline(
  claim: OfflineClaim["claim"]
): Promise<string> {
  const db = await getDB();
  const localId = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const offlineClaim: OfflineClaim = {
    localId,
    claim,
    savedAt: new Date().toISOString(),
    synced: false,
  };

  await db.put(CLAIMS_STORE, offlineClaim);
  return localId;
}

export async function getPendingOfflineClaims(): Promise<OfflineClaim[]> {
  const db = await getDB();
  const all = await db.getAll(CLAIMS_STORE);
  return all.filter((c) => !c.synced);
}

export async function markClaimSynced(localId: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get(CLAIMS_STORE, localId);
  if (existing) {
    await db.put(CLAIMS_STORE, { ...existing, synced: true });
  }
}

export async function deleteOfflineClaim(localId: string): Promise<void> {
  const db = await getDB();
  await db.delete(CLAIMS_STORE, localId);
}

export async function countPendingOfflineClaims(): Promise<number> {
  const claims = await getPendingOfflineClaims();
  return claims.length;
}
