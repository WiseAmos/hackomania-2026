import { NextRequest, NextResponse } from "next/server";
import { getOpenPaymentsClient, normalizeWalletUrl } from "../../../../lib/openPayments";
import { adminDb } from "../../../../lib/firebaseAdmin";

/**
 * POST /api/ilp/claim
 *
 * Fulfills a relief claim by smartly assembling multiple fund pool grants.
 * If the pool has grants of $30 + $70, and a claim is for $100,
 * both grants are executed and streamed to the claimant.
 *
 * Body: { claimantWallet, amount (in cents), description }
 */
// ─── Fulfill the Claim from Firebase Grants ───────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { claimantWallet, amount, description } = body;

        if (!claimantWallet || !amount) {
            return NextResponse.json({ message: "Missing claimantWallet or amount" }, { status: 400 });
        }

        const amountCents = parseInt(amount);

        // 1. Fetch available pool bounds
        const grantsSnap = await adminDb.ref("pool/grants")
            .orderByChild("status")
            .equalTo("available")
            .once("value");

        const availableGrants: any[] = [];
        let poolBalance = 0;

        grantsSnap.forEach(child => {
            const g = { id: child.key, ...child.val() };
            availableGrants.push(g);
            poolBalance += g.amount;
        });

        if (poolBalance < amountCents) {
            return NextResponse.json(
                { message: `Insufficient pool balance. Available: ${poolBalance} cents`, poolBalance, requested: amountCents },
                { status: 400 }
            );
        }

        // Smart assembly: sort grants descending by amount, pick largest to minimize ILP requests
        availableGrants.sort((a, b) => b.amount - a.amount);
        const selectedGrants = [];
        let totalAssembled = 0;

        for (const entry of availableGrants) {
            if (totalAssembled >= amountCents) break;
            selectedGrants.push(entry);
            totalAssembled += entry.amount;
        }

        const client = await getOpenPaymentsClient();
        const claimantUrl = normalizeWalletUrl(claimantWallet);
        const claimantWalletInfo = await client.walletAddress.get({ url: claimantUrl });

        const payments: { grantId: string; amountPaid: number }[] = [];
        let remaining = amountCents;

        // 2. Stream payments out of the OpenPayments network into the claimant
        for (const poolEntry of selectedGrants) {
            if (remaining <= 0) break;

            const payAmount = Math.min(remaining, poolEntry.amount);

            try {
                const sourceWallet = await client.walletAddress.get({ url: poolEntry.walletUrl });

                const quote = await client.quote.create(
                    { url: sourceWallet.resourceServer, accessToken: poolEntry.accessToken },
                    {
                        walletAddress: sourceWallet.id,
                        receiver: claimantWalletInfo.id,
                        method: "ilp",
                        debitAmount: { assetCode: "SGD", assetScale: 2, value: payAmount.toString() },
                    }
                );

                await client.outgoingPayment.create(
                    { url: sourceWallet.resourceServer, accessToken: poolEntry.accessToken },
                    { walletAddress: sourceWallet.id, quoteId: quote.id }
                );

                // Determine if grant is heavily exhausted
                const newAmount = poolEntry.amount - payAmount;
                const newStatus = newAmount === 0 ? "claimed" : "available";

                await adminDb.ref(`pool/grants/${poolEntry.id}`).update({
                    amount: newAmount,
                    status: newStatus
                });

                // Update TVL in stats
                const tvlRef = adminDb.ref("pool/stats/totalValueLocked");
                const tvlSnap = await tvlRef.once("value");
                await tvlRef.set(Math.max(0, (tvlSnap.val() || 0) - (payAmount / 100)));

                payments.push({ grantId: poolEntry.id, amountPaid: payAmount });
                remaining -= payAmount;

                console.log(`[claim] Paid ${payAmount}c out from grant ${poolEntry.id}`);
            } catch (payErr) {
                console.error(`[claim] Failed ILP transit for grant ${poolEntry.id}:`, payErr);
            }
        }

        const totalPaid = amountCents - remaining;

        return NextResponse.json({
            success: remaining === 0,
            totalPaid,
            totalRequested: amountCents,
            grantsUsed: payments.length,
            payments,
            description,
        });
    } catch (err) {
        console.error("[ilp/claim] error:", err);
        return NextResponse.json({ message: "Failed to fulfill claim", error: String(err) }, { status: 500 });
    }
}
