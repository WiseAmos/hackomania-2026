import { NextRequest, NextResponse } from "next/server";
import { isPendingGrant } from "@interledger/open-payments";
import {
    getOpenPaymentsClient,
    generateNonce,
    normalizeWalletUrl,
} from "../../../../lib/openPayments";
import { addGrant, addWager } from "../../../../lib/store";
import crypto from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

/**
 * GET /api/ilp/grant
 *
 * Creates an interactive outgoing-payment + quote grant for a wager participant.
 *
 * Query params:
 *   - walletAddress: the participant's wallet (e.g. "james" or "$ilp.interledger-test.dev/james")
 *   - amount: stake amount in cents (e.g. "1000" for $10.00)
 *   - wagerId: (optional) existing wager ID if player 2 is joining
 *   - title: wager title
 *   - description: wager description
 *   - deadline: ISO date string
 *   - player: "player1" or "player2"
 *   - opponentWallet: the opponent's wallet address
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");
    const amount = searchParams.get("amount");
    const player = searchParams.get("player") ?? "player1";
    const title = searchParams.get("title") ?? "Untitled Showdown";
    const description = searchParams.get("description") ?? "";
    const deadline = searchParams.get("deadline") ?? "";
    const opponentWallet = searchParams.get("opponentWallet") ?? "";
    let wagerId = searchParams.get("wagerId");

    if (!walletAddress || !amount) {
        return NextResponse.json(
            { message: "Missing walletAddress or amount" },
            { status: 400 }
        );
    }

    try {
        const client = await getOpenPaymentsClient();
        const NONCE = generateNonce();
        const walletUrl = normalizeWalletUrl(walletAddress);

        const wallet = await client.walletAddress.get({ url: walletUrl });

        // Request an interactive outgoing payment grant (per Open Payments docs)
        const grant = await client.grant.request(
            { url: wallet.authServer },
            {
                access_token: {
                    access: [
                        {
                            identifier: wallet.id,
                            type: "outgoing-payment",
                            actions: ["read", "create"],
                            limits: {
                                debitAmount: {
                                    assetCode: "SGD",
                                    assetScale: 2,
                                    value: amount,
                                },
                            },
                        },
                    ],
                },
                interact: {
                    start: ["redirect"],
                    finish: {
                        method: "redirect",
                        uri: `${BASE_URL}/wager?player=${player}&wagerId=${wagerId ?? "NEW"}`,
                        nonce: NONCE,
                    },
                },
            }
        );

        if (!isPendingGrant(grant)) {
            return NextResponse.json(
                { message: "Expected interactive grant" },
                { status: 500 }
            );
        }

        // Create a new wager if player1 is initiating
        const grantId = crypto.randomUUID();

        if (!wagerId || wagerId === "NEW") {
            wagerId = crypto.randomUUID();
            addWager({
                id: wagerId,
                title,
                description,
                stakeAmount: parseInt(amount),
                deadline,
                player1Wallet: walletUrl,
                player2Wallet: normalizeWalletUrl(opponentWallet),
                player1GrantId: grantId,
                player2GrantId: "",
                status: "awaiting_auth",
                createdAt: new Date().toISOString(),
            });
        }

        // Store the grant
        addGrant({
            id: grantId,
            wagerId,
            participantId: player,
            walletUrl,
            amount: parseInt(amount),
            continueToken: grant.continue.access_token.value,
            continueUri: grant.continue.uri,
            status: "pending",
        });

        return NextResponse.json({
            grantUrl: grant.interact.redirect,
            continueToken: grant.continue.access_token.value,
            continueUri: grant.continue.uri,
            wagerId,
            grantId,
        });
    } catch (err) {
        console.error("[ilp/grant] error:", err);
        return NextResponse.json(
            { message: "Failed to request grant", error: String(err) },
            { status: 500 }
        );
    }
}
