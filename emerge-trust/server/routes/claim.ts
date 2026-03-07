import { Router, type Request, type Response } from "express";
import { rtdb } from "../lib/firebaseAdmin";

const router = Router();

// ─── Submit claim (Phase 1 Bot Scoring) ────────────────────────────────────
// POST /api/claims
router.post("/", async (req: Request, res: Response) => {
  // We parse it assuming 'claim' is just sent as JSON or multipart form
  const claimStr = req.body.claim;
  let claim;
  try {
    claim = typeof claimStr === "string" ? JSON.parse(claimStr) : claimStr;
  } catch (err) {
    return res.status(400).json({ message: "Invalid claim JSON" });
  }

  if (!claim || !claim.userId || !claim.zoneId || !claim.requestedAmount || !claim.category) {
    return res.status(400).json({ message: "Missing required claim fields including category" });
  }

  try {
    // Verify zone is active
    const zoneSnap = await rtdb.ref(`disasterZones/${claim.zoneId}`).get();
    if (!zoneSnap.exists() || zoneSnap.val()?.status !== "active") {
      return res.status(403).json({ message: "Zone is not in active disaster state" });
    }

    const tier1Amount = Math.round(claim.requestedAmount * 0.2);
    const tier2Amount = claim.requestedAmount - tier1Amount;

    // The $5 Stake verification (Mocked)
    // Here we would verify that an incoming payment of $5 was authorized/received.

    // Create claim document in RTDB
    const claimRef = rtdb.ref("claims").push();
    const claimId = claimRef.key;

    if (!claimId) throw new Error("Could not generate claim ID");

    await claimRef.set({
      ...claim,
      id: claimId,
      status: "pending",
      tier1Amount,
      tier2Amount,
      botScore: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Fire-and-forget the Phase 1 Bot Scorer 
    const baseUrl = process.env.BASE_URL ?? "http://localhost:3001";
    fetch(`${baseUrl}/api/oracle/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimId,
        category: claim.category,
        userId: claim.userId,
        zoneId: claim.zoneId
      })
    }).catch(err => console.error("Failed to trigger scoring bot:", err));

    return res.status(201).json({ claimId });
  } catch (err) {
    console.error("[claims/post] error:", err);
    return res.status(500).json({ message: "Failed to submit claim" });
  }
});

// ─── Resolve voting (called by admin time-travel or cron) ────────────────────
// POST /api/claims/:claimId/resolve
router.post("/:claimId/resolve", async (req: Request, res: Response) => {
  const { claimId } = req.params;

  try {
    const claimSnap = await rtdb.ref(`claims/${claimId}`).get();
    if (!claimSnap.exists()) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const claim = claimSnap.val()!;

    // Tally votes
    const votesSnap = await rtdb.ref("votes").orderByChild("claimId").equalTo(claimId).get();

    let weightedApprove = 0;
    let weightedReject = 0;

    if (votesSnap.exists()) {
      votesSnap.forEach((voteDoc) => {
        const vote = voteDoc.val();
        const weight = Math.max(1, vote.trustScoreAtVote ?? 1);
        if (vote.choice === "approve") {
          weightedApprove += weight;
        } else {
          weightedReject += weight;
        }
      });
    }

    const outcome = weightedApprove >= weightedReject ? "approved" : "rejected";

    if (outcome === "approved") {
      await releaseTier2Payout(claimId, claim.userId, claim.tier2Amount);
      await rtdb.ref(`claims/${claimId}`).update({
        status: "tier2_paid",
        updatedAt: new Date().toISOString(),
      });
    } else {
      await rtdb.ref(`claims/${claimId}`).update({
        status: "rejected",
        updatedAt: new Date().toISOString(),
      });
    }

    return res.json({ success: true, outcome, weightedApprove, weightedReject });
  } catch (err) {
    console.error("[claims/resolve] error:", err);
    return res.status(500).json({ message: "Failed to resolve claim" });
  }
});

// ─── Admin: Time travel (immediate voting resolution) ────────────────────────
// POST /api/admin/time-travel
router.post("/admin/time-travel", async (req: Request, res: Response) => {
  const { claimId } = req.body as { claimId: string };

  if (!claimId) {
    return res.status(400).json({ message: "claimId required" });
  }

  const resolveFetch = await fetch(
    `http://localhost:${process.env.PORT ?? 3001}/api/claims/${claimId}/resolve`,
    { method: "POST" }
  );

  const data = await resolveFetch.json();
  return res.json(data);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function releaseTier1Payout(claimId: string, userId: string, amount: number): Promise<void> {
  console.log(`[Tier1] Releasing ${amount} for claim ${claimId} user ${userId}`);

  try {
    const vaultRef = rtdb.ref("communityVault/main");
    await vaultRef.transaction((currentData) => {
      if (currentData === null) return currentData;
      currentData.totalPaidOut = (currentData.totalPaidOut || 0) + amount;
      currentData.totalBalance = (currentData.totalBalance || 0) - amount;
      return currentData;
    });

    await rtdb.ref("payouts").push({
      claimId,
      userId,
      amount,
      tier: 1,
      status: "completed",
      createdAt: new Date().toISOString(),
    });
  } catch (e) { console.error("Tier1 mock payout failed", e); }
}

async function releaseTier2Payout(claimId: string, userId: string, amount: number): Promise<void> {
  console.log(`[Tier2] Releasing ${amount} for claim ${claimId} user ${userId}`);

  try {
    const vaultRef = rtdb.ref("communityVault/main");
    await vaultRef.transaction((currentData) => {
      if (currentData === null) return currentData;
      currentData.totalPaidOut = (currentData.totalPaidOut || 0) + amount;
      currentData.totalBalance = (currentData.totalBalance || 0) - amount;
      return currentData;
    });

    await rtdb.ref("payouts").push({
      claimId,
      userId,
      amount,
      tier: 2,
      status: "completed",
      createdAt: new Date().toISOString(),
    });
  } catch (e) { console.error("Tier2 mock payout failed", e); }
}

export default router;
