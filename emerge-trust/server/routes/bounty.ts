import { Router, type Request, type Response } from "express";
import { rtdb } from "../lib/firebaseAdmin";

const router = Router();

// ─── Slash a fraudulent claim (The Bounty Hunter Mechanic) ────────────────────
// POST /api/bounty/slash/:claimId
router.post("/slash/:claimId", async (req: Request, res: Response) => {
    const { claimId } = req.params;
    const { hunterId } = req.body;

    if (!hunterId) return res.status(400).json({ message: "Hunter ID required" });

    try {
        const claimSnap = await rtdb.ref(`claims/${claimId}`).get();
        if (!claimSnap.exists()) return res.status(404).json({ message: "Claim not found" });

        const claim = claimSnap.val()!;
        if (claim.status === "fraudulent") {
            return res.status(400).json({ message: "Claim is already slashed" });
        }

        // Slash the $5 stake
        const STAKE_AMOUNT = 5.00;
        const hunterReward = STAKE_AMOUNT * 0.5;
        const poolRefund = STAKE_AMOUNT * 0.5;

        // Update the claim status
        await rtdb.ref(`claims/${claimId}`).update({
            status: "fraudulent",
            slashedBy: hunterId,
            updatedAt: new Date().toISOString()
        });

        // Award the hunter (Trust Score Boost + Reward)
        const hunterSnap = await rtdb.ref(`users/${hunterId}/trustScore`).get();
        await rtdb.ref(`users/${hunterId}/trustScore`).set((hunterSnap.val() || 0) + 10);

        await rtdb.ref("payouts").push({
            userId: hunterId,
            amount: hunterReward,
            reason: "bounty_hunter_reward",
            createdAt: new Date().toISOString()
        });

        // Refund 50% back to community pool
        const vaultRef = rtdb.ref("communityVault/main");
        await vaultRef.transaction((currentData) => {
            if (currentData === null) return currentData;
            currentData.totalBalance = (currentData.totalBalance || 0) + poolRefund;
            return currentData;
        });

        return res.json({ success: true, slashedAmount: STAKE_AMOUNT, hunterReward, poolRefund });
    } catch (err) {
        console.error("[bounty/slash] error:", err);
        return res.status(500).json({ message: "Failed to slash claim" });
    }
});

export default router;
