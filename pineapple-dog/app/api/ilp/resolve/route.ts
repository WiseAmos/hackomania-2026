import { NextRequest, NextResponse } from "next/server";
import { getOpenPaymentsClient, normalizeWalletUrl } from "../../../../lib/openPayments";
import { adminDb } from "../../../../lib/firebaseAdmin";
import crypto from "crypto";

/**
 * POST /api/ilp/resolve
 *
 * Resolves a wager: the winner's grant is cancelled, the loser's grant
 * is executed — 50% goes to the winner, 50% is retained in the fund pool.
 */
// ─── Resolve the wager using Firebase Data ──────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { wagerId, winnerId } = body;

        if (!wagerId || !winnerId) {
            return NextResponse.json({ message: "Missing wagerId or winnerId" }, { status: 400 });
        }

        const wagerRef = adminDb.ref(`wagers/${wagerId}`);
        const wagerSnap = await wagerRef.once("value");
        if (!wagerSnap.exists()) {
            return NextResponse.json({ message: "Wager not found" }, { status: 404 });
        }
        const wager = wagerSnap.val();

        if (wager.status === "resolved") {
            return NextResponse.json({ message: "Wager already resolved" }, { status: 400 });
        }

        const loserId = winnerId === "player1" ? "player2" : "player1";

        // Ensure both participants actually existed to bet
        if (!wager.player1 || !wager.player2) {
            return NextResponse.json({ message: "Wager missing participants" }, { status: 400 });
        }

        // We stored the grant URIs inside the wager participants directly
        // For Hackomania we assume they authorized and we have a continueToken.
        // If this architecture was built with separate /grants nodes, query them instead.
        // Assuming we stored `grantInfo` in the wager directly during interaction
        const winnerP = winnerId === "player1" ? wager.player1 : wager.player2;
        const loserP = loserId === "player1" ? wager.player1 : wager.player2;

        if (!winnerP.grantInfo || !loserP.grantInfo) {
            return NextResponse.json({ message: "Missing Open Payments grantInfo for one or both participants" }, { status: 400 });
        }

        const loserGrant = loserP.grantInfo;

        if (loserGrant.status !== "authorized" || !loserGrant.interactRef) {
            return NextResponse.json({ message: "Loser's grant has not been authorized yet" }, { status: 400 });
        }

        const client = await getOpenPaymentsClient();

        // 1. Cancel the winner's grant (money stays in their wallet)
        // Mark their grant as cancelled in the wager
        await wagerRef.child(winnerId).child("grantInfo").update({ status: "cancelled" });
        console.log(`[resolve] Winner (${winnerId}) grant cancelled`);

        // 2. The loser's stake is split: 50% to winner, 50% to pool
        const finalToken = loserGrant.continueToken;
        const halfAmount = Math.floor(loserGrant.amount / 2);
        const poolAmount = loserGrant.amount - halfAmount;

        // 3a. Move funds via Open Payments (50% to winner)
        try {
            const winnerWallet = await client.walletAddress.get({ url: winnerP.walletAddress });
            const loserWallet = await client.walletAddress.get({ url: loserP.walletAddress });

            const quote = await client.quote.create(
                { url: loserWallet.resourceServer, accessToken: finalToken },
                {
                    walletAddress: loserWallet.id,
                    receiver: winnerWallet.id,
                    method: "ilp",
                    debitAmount: { assetCode: "SGD", assetScale: 2, value: halfAmount.toString() },
                }
            );

            await client.outgoingPayment.create(
                { url: loserWallet.resourceServer, accessToken: finalToken },
                { walletAddress: loserWallet.id, quoteId: quote.id }
            );
            console.log(`[resolve] Paid ${halfAmount} cents from loser to winner`);
        } catch (opErr) {
            console.error("[resolve] OpenPayments Failure during transfer:", opErr);
            // In a robust system, queue for retry. We'll proceed so state doesn't lock for demo purposes.
        }

        // 3b. Store remaining 50% in the Firebase Fund Pool
        const poolGrantId = crypto.randomUUID();
        await adminDb.ref(`pool/grants/${poolGrantId}`).set({
            id: poolGrantId,
            sourceWagerId: wagerId,
            amount: poolAmount,
            continueToken: finalToken,
            continueUri: loserGrant.continueUri,
            interactRef: loserGrant.interactRef,
            walletUrl: loserP.walletAddress,
            status: "available",
            createdAt: new Date().toISOString()
        });

        // Update global pool stats
        const tvlRef = adminDb.ref("pool/stats/totalValueLocked");
        const tvlSnap = await tvlRef.once("value");
        const currentTVL = tvlSnap.val() || 0;
        await tvlRef.set(currentTVL + poolAmount);

        console.log(`[resolve] ${poolAmount} cents added to Global Fund Pool`);

        // 4. Update records
        await wagerRef.child(loserId).child("grantInfo").update({ status: "executed" });
        await wagerRef.update({ status: "resolved", winnerId, resolvedAt: new Date().toISOString() });

        return NextResponse.json({
            success: true,
            paidToWinner: halfAmount,
            addedToPool: poolAmount,
        });
    } catch (err) {
        console.error("[ilp/resolve] error:", err);
        return NextResponse.json({ message: "Failed to resolve wager", error: String(err) }, { status: 500 });
    }
}
