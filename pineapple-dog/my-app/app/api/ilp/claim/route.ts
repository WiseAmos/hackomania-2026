import { NextRequest, NextResponse } from "next/server";
import { getOpenPaymentsClient, normalizeWalletUrl } from "../../../../lib/openPayments";
import { assembleGrantsForClaim, getTotalPoolBalance } from "../../../../lib/store";

/**
 * POST /api/ilp/claim
 *
 * Fulfills a relief claim by smartly assembling multiple fund pool grants.
 * If the pool has grants of $30 + $70, and a claim is for $100,
 * both grants are executed and streamed to the claimant.
 *
 * Body: { claimantWallet, amount (in cents), description }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { claimantWallet, amount, description } = body;

        if (!claimantWallet || !amount) {
            return NextResponse.json(
                { message: "Missing claimantWallet or amount" },
                { status: 400 }
            );
        }

        const amountCents = parseInt(amount);
        const poolBalance = getTotalPoolBalance();

        if (poolBalance < amountCents) {
            return NextResponse.json(
                {
                    message: `Insufficient pool balance. Available: ${poolBalance} cents, Requested: ${amountCents} cents`,
                    poolBalance,
                    requested: amountCents,
                },
                { status: 400 }
            );
        }

        // Smart assembly: pick the best combination of grants
        const { grants, totalAssembled, sufficient } =
            assembleGrantsForClaim(amountCents);

        if (!sufficient) {
            return NextResponse.json(
                { message: "Could not assemble sufficient grants" },
                { status: 500 }
            );
        }

        const client = await getOpenPaymentsClient();
        const claimantUrl = normalizeWalletUrl(claimantWallet);
        const claimantWalletInfo = await client.walletAddress.get({
            url: claimantUrl,
        });

        const payments: { grantId: string; amountPaid: number }[] = [];
        let remaining = amountCents;

        for (const poolEntry of grants) {
            if (remaining <= 0) break;

            const payAmount = Math.min(remaining, poolEntry.amount);

            try {
                // Get the source wallet for this pool grant
                const sourceWallet = await client.walletAddress.get({
                    url: poolEntry.walletUrl,
                });

                // Create a quote for this portion
                const quote = await client.quote.create(
                    {
                        url: sourceWallet.resourceServer,
                        accessToken: poolEntry.continueToken,
                    },
                    {
                        walletAddress: sourceWallet.id,
                        receiver: claimantWalletInfo.id,
                        method: "ilp",
                        debitAmount: {
                            assetCode: "SGD",
                            assetScale: 2,
                            value: payAmount.toString(),
                        },
                    }
                );

                // Execute the outgoing payment
                await client.outgoingPayment.create(
                    {
                        url: sourceWallet.resourceServer,
                        accessToken: poolEntry.continueToken,
                    },
                    { walletAddress: sourceWallet.id, quoteId: quote.id }
                );

                // Mark this pool entry as claimed
                poolEntry.status = "claimed";
                payments.push({ grantId: poolEntry.grantId, amountPaid: payAmount });
                remaining -= payAmount;

                console.log(
                    `[claim] Paid ${payAmount} cents from pool grant ${poolEntry.id} to ${claimantUrl}`
                );
            } catch (payErr) {
                console.error(
                    `[claim] Failed to pay from pool grant ${poolEntry.id}:`,
                    payErr
                );
                // Continue with next grant — partial fulfillment is OK
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
        return NextResponse.json(
            { message: "Failed to fulfill claim", error: String(err) },
            { status: 500 }
        );
    }
}
