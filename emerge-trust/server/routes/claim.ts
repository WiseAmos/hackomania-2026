import { Router, type Request, type Response } from "express";
import { db } from "../lib/firebaseAdmin";
import { getOpenPaymentsClient } from "../lib/openPaymentsClient";
import { FieldValue } from "firebase-admin/firestore";

const router = Router();

const VAULT_WALLET = process.env.VAULT_WALLET_ADDRESS ?? "";
const CLAIM_WALLET = process.env.EMERGETRUST_WALLET_ADDRESS ?? "";

// ─── Submit claim (Tier 1 instant payout) ────────────────────────────────────
// POST /api/claims
router.post("/", async (req: Request, res: Response) => {
  const claim = req.body;

  if (!claim.userId || !claim.zoneId || !claim.requestedAmount) {
    return res.status(400).json({ message: "Missing required claim fields" });
  }

  try {
    // Verify zone is active
    const zoneSnap = await db.collection("disasterZones").doc(claim.zoneId).get();
    if (!zoneSnap.exists || zoneSnap.data()?.status !== "active") {
      return res.status(403).json({ message: "Zone is not in active disaster state" });
    }

    const tier1Amount = Math.round(claim.requestedAmount * 0.2);
    const tier2Amount = claim.requestedAmount - tier1Amount;

    // Create claim document
    const claimRef = await db.collection("claims").add({
      ...claim,
      status: "pending",
      tier1Amount,
      tier2Amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Trigger Tier 1 instant payout (20%)
    await releaseTier1Payout(claimRef.id, claim.userId, tier1Amount);

    // Set voting deadline (24 hours from now)
    const votingDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await claimRef.update({
      status: "tier1_paid",
      votingDeadlineAt: votingDeadline,
    });

    // After a delay, move to "voting" status
    setTimeout(async () => {
      await claimRef.update({ status: "voting" });
    }, 2000);

    return res.status(201).json({ claimId: claimRef.id });
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
    const claimSnap = await db.collection("claims").doc(claimId).get();
    if (!claimSnap.exists) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const claim = claimSnap.data()!;

    // Tally votes
    const votesSnap = await db
      .collection("votes")
      .where("claimId", "==", claimId)
      .get();

    let weightedApprove = 0;
    let weightedReject = 0;

    for (const voteDoc of votesSnap.docs) {
      const vote = voteDoc.data();
      const weight = Math.max(1, vote.trustScoreAtVote ?? 1);
      if (vote.choice === "approve") {
        weightedApprove += weight;
      } else {
        weightedReject += weight;
      }
    }

    const outcome = weightedApprove >= weightedReject ? "approved" : "rejected";

    if (outcome === "approved") {
      await releaseTier2Payout(claimId, claim.userId, claim.tier2Amount);
      await claimSnap.ref.update({
        status: "tier2_paid",
        updatedAt: new Date().toISOString(),
      });
    } else {
      await claimSnap.ref.update({
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

// ─── Admin: Simulate wager failures ──────────────────────────────────────────
// POST /api/admin/simulate-wager-fails
router.post("/admin/simulate-wager-fails", async (req: Request, res: Response) => {
  const { count = 50 } = req.body as { count: number };

  try {
    // Get locked wagers (limited to count)
    const wagersSnap = await db
      .collection("wagers")
      .where("status", "==", "locked")
      .limit(count)
      .get();

    let totalStreamed = 0;
    const batch = db.batch();

    for (const wagerDoc of wagersSnap.docs) {
      const wager = wagerDoc.data();
      batch.update(wagerDoc.ref, { status: "streaming" });
      totalStreamed += wager.amount;
    }

    await batch.commit();

    // Update vault balance
    await db.collection("communityVault").doc("main").update({
      totalStreamed: FieldValue.increment(totalStreamed),
      totalBalance: FieldValue.increment(totalStreamed),
    });

    return res.json({ processed: wagersSnap.size, totalStreamed });
  } catch (err) {
    console.error("[admin/simulate-wager-fails] error:", err);
    return res.status(500).json({ message: "Simulation failed" });
  }
});

// ─── Admin: Time travel (immediate voting resolution) ────────────────────────
// POST /api/admin/time-travel
router.post("/admin/time-travel", async (req: Request, res: Response) => {
  const { claimId } = req.body as { claimId: string };

  if (!claimId) {
    return res.status(400).json({ message: "claimId required" });
  }

  // Proxy to resolve endpoint
  const resolveFetch = await fetch(
    `http://localhost:${process.env.PORT ?? 3001}/api/claims/${claimId}/resolve`,
    { method: "POST" }
  );

  const data = await resolveFetch.json();
  return res.json(data);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function releaseTier1Payout(
  claimId: string,
  userId: string,
  amount: number
): Promise<void> {
  // In full implementation, this triggers an Open Payments transfer
  // from the CommunityVault to the user's wallet
  console.log(`[Tier1] Releasing ${amount} for claim ${claimId} user ${userId}`);

  await db.collection("communityVault").doc("main").update({
    totalPaidOut: FieldValue.increment(amount),
    totalBalance: FieldValue.increment(-amount),
  });

  await db.collection("payouts").add({
    claimId,
    userId,
    amount,
    tier: 1,
    status: "completed",
    createdAt: new Date().toISOString(),
  });
}

async function releaseTier2Payout(
  claimId: string,
  userId: string,
  amount: number
): Promise<void> {
  console.log(`[Tier2] Releasing ${amount} for claim ${claimId} user ${userId}`);

  await db.collection("communityVault").doc("main").update({
    totalPaidOut: FieldValue.increment(amount),
    totalBalance: FieldValue.increment(-amount),
  });

  await db.collection("payouts").add({
    claimId,
    userId,
    amount,
    tier: 2,
    status: "completed",
    createdAt: new Date().toISOString(),
  });

  // Reward auditors who voted correctly
  // (Implemented in full TDD phase)
}

export default router;
