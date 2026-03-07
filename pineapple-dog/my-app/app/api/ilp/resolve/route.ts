import { NextRequest, NextResponse } from "next/server";
import { getOpenPaymentsClient, normalizeWalletUrl } from "../../../../lib/openPayments";
import {
    getWager,
    updateWager,
    getGrantsByWager,
    updateGrant,
    addPoolGrant,
} from "../../../../lib/store";
import crypto from "crypto";

/**
 * POST /api/ilp/resolve
 *
 * Resolves a wager: the winner's grant is cancelled, the loser's grant
 * is executed — 50% goes to the winner, 50% is retained in the fund pool.
 *
 * Body: { wagerId, winnerId: "player1" | "player2" }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { wagerId, winnerId } = body;

        if (!wagerId || !winnerId) {
            return NextResponse.json(
                { message: "Missing wagerId or winnerId" },
                { status: 400 }
            );
        }

        const wager = getWager(wagerId);
        if (!wager) {
            return NextResponse.json(
                { message: "Wager not found" },
                { status: 404 }
            );
        }

        if (wager.status === "resolved") {
            return NextResponse.json(
                { message: "Wager already resolved" },
                { status: 400 }
            );
        }

        const loserId = winnerId === "player1" ? "player2" : "player1";
        const grants = getGrantsByWager(wagerId);

        const winnerGrant = grants.find((g) => g.participantId === winnerId);
        const loserGrant = grants.find((g) => g.participantId === loserId);

        if (!winnerGrant || !loserGrant) {
            return NextResponse.json(
                { message: "Missing grants for one or both participants" },
                { status: 400 }
            );
        }

        if (loserGrant.status !== "authorized" || !loserGrant.interactRef) {
            return NextResponse.json(
                { message: "Loser's grant has not been authorized yet" },
                { status: 400 }
            );
        }

        const client = await getOpenPaymentsClient();

        // 1. Cancel the winner's grant (they get their money back — grant never executes)
        updateGrant(winnerGrant.id, { status: "cancelled" });
        console.log(`[resolve] Winner (${winnerId}) grant cancelled — money stays in their wallet`);

        // 2. Use the pre-finalized access token from /interact (Step 5 of Open Payments docs)
        // The grant was already continued in the /interact route, so we can use the token directly
        const finalToken = loserGrant.continueToken;

        // 3. The loser's stake is split: 50% to winner, 50% to pool
        const halfAmount = Math.floor(loserGrant.amount / 2);
        const poolAmount = loserGrant.amount - halfAmount; // handles odd cents

        // 3a. Create incoming payment on winner's wallet, then outgoing from loser
        const winnerWalletUrl =
            winnerId === "player1" ? wager.player1Wallet : wager.player2Wallet;
        const loserWalletUrl =
            loserId === "player1" ? wager.player1Wallet : wager.player2Wallet;

        const winnerWallet = await client.walletAddress.get({
            url: winnerWalletUrl,
        });
        const loserWallet = await client.walletAddress.get({
            url: loserWalletUrl,
        });

        // Create a quote for the winner's half
        const quote = await client.quote.create(
            { url: loserWallet.resourceServer, accessToken: finalToken },
            {
                walletAddress: loserWallet.id,
                receiver: winnerWallet.id,
                method: "ilp",
                debitAmount: {
                    assetCode: "SGD",
                    assetScale: 2,
                    value: halfAmount.toString(),
                },
            }
        );

        // Execute the outgoing payment (50% to winner)
        await client.outgoingPayment.create(
            { url: loserWallet.resourceServer, accessToken: finalToken },
            { walletAddress: loserWallet.id, quoteId: quote.id }
        );

        console.log(`[resolve] Paid ${halfAmount} cents from loser to winner`);

        // 3b. Store the remaining 50% as a fund pool grant
        addPoolGrant({
            id: crypto.randomUUID(),
            grantId: loserGrant.id,
            sourceWagerId: wagerId,
            amount: poolAmount,
            continueToken: finalToken,
            continueUri: loserGrant.continueUri,
            interactRef: loserGrant.interactRef,
            walletUrl: loserWalletUrl,
            status: "available",
        });

        console.log(`[resolve] ${poolAmount} cents added to fund pool`);

        // 4. Update records
        updateGrant(loserGrant.id, { status: "executed" });
        updateWager(wagerId, { status: "resolved", winnerId });

        return NextResponse.json({
            success: true,
            paidToWinner: halfAmount,
            addedToPool: poolAmount,
        });
    } catch (err) {
        console.error("[ilp/resolve] error:", err);
        return NextResponse.json(
            { message: "Failed to resolve wager", error: String(err) },
            { status: 500 }
        );
    }
}
