import { NextRequest, NextResponse } from "next/server";
import { isPendingGrant } from "@interledger/open-payments";
import { adminDb } from "../../../../../lib/firebaseAdmin";
import {
    getOpenPaymentsClient,
    generateNonce,
    normalizeWalletUrl,
} from "../../../../../lib/openPayments";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { senderWallet, receiverWallet, amount } = body;

        if (!senderWallet || !receiverWallet || !amount) {
            return NextResponse.json(
                { message: "Missing required fields: senderWallet, receiverWallet, amount" },
                { status: 400 }
            );
        }

        const client = await getOpenPaymentsClient();
        const NONCE = generateNonce();

        // Normalize user inputs
        const normalizedSender = normalizeWalletUrl(senderWallet);
        const normalizedReceiver = normalizeWalletUrl(receiverWallet);

        const senderDetails = await client.walletAddress.get({ url: normalizedSender });
        const grantId = crypto.randomUUID();

        const urlObj = new URL(req.url);
        const dynamicBaseUrl = `${urlObj.protocol}//${urlObj.host}`;

        // Request an interactive outgoing payment grant
        const grant = await client.grant.request(
            { url: senderDetails.authServer },
            {
                access_token: {
                    access: [
                        {
                            identifier: senderDetails.id,
                            type: "outgoing-payment",
                            actions: ["read", "create", "list"],
                            limits: {
                                debitAmount: {
                                    // Add a generous buffer (e.g. 50%) to account for TestNet routing fees.
                                    // The actual amount debited will be strictly defined by the quote, not this limit.
                                    value: Math.floor(Number(amount) * 1.5 + 50).toString(),
                                    assetCode: senderDetails.assetCode,
                                    assetScale: senderDetails.assetScale,
                                },
                            },
                        },
                    ],
                },
                interact: {
                    start: ["redirect"],
                    finish: {
                        method: "redirect",
                        uri: `${dynamicBaseUrl}/testingpayment?grantId=${grantId}`,
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

        // Request a separate non-interactive quote grant.
        // Rafiki requires type:"quote" access for quote.create — the outgoing-payment token alone is not sufficient.
        const quoteGrant = await client.grant.request(
            { url: senderDetails.authServer },
            {
                access_token: {
                    access: [{ type: "quote", actions: ["create", "read"] }],
                },
            }
        );
        const quoteAccessToken = (quoteGrant as any).access_token?.value;
        if (!quoteAccessToken) {
            return NextResponse.json({ message: "Failed to obtain non-interactive quote grant" }, { status: 500 });
        }

        // Persist to Firebase for the callback
        const firebaseGrant = {
            id: grantId,
            senderWallet: normalizedSender,
            receiverWallet: normalizedReceiver,
            amount: parseInt(amount),
            continueToken: grant.continue.access_token.value,
            continueUri: grant.continue.uri,
            quoteAccessToken,
            status: "pending",
            createdAt: new Date().toISOString()
        };

        await adminDb.ref(`testing_grants/${grantId}`).set(firebaseGrant);

        return NextResponse.json({
            grantUrl: grant.interact.redirect,
            grantId,
        });
    } catch (err) {
        console.error("[testing/grant] error:", err);
        return NextResponse.json(
            { message: "Failed to request testing grant", error: String(err) },
            { status: 500 }
        );
    }
}
