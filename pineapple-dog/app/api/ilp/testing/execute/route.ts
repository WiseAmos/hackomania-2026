import { NextRequest, NextResponse } from "next/server";
import { getOpenPaymentsClient } from "../../../../../lib/openPayments";
import { adminDb } from "../../../../../lib/firebaseAdmin";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { grantId, amount } = body;

        if (!grantId || !amount) {
            return NextResponse.json({ message: "Missing grantId or amount" }, { status: 400 });
        }

        const snap = await adminDb.ref(`testing_grants/${grantId}`).once("value");
        if (!snap.exists()) {
            return NextResponse.json({ message: "Testing grant not found" }, { status: 404 });
        }
        const grant = snap.val();

        if (grant.status !== "authorized" && grant.status !== "executed") {
            return NextResponse.json({ message: `Grant must be authorized before execution (status: ${grant.status})` }, { status: 400 });
        }

        const finalAccessToken = grant.finalAccessToken;
        if (!finalAccessToken) {
            return NextResponse.json({ message: "No final access token found on grant" }, { status: 400 });
        }

        const quoteAccessToken = grant.quoteAccessToken;
        if (!quoteAccessToken) {
            return NextResponse.json({ message: "No quote access token found on grant — re-authorize to get a fresh grant" }, { status: 400 });
        }

        const client = await getOpenPaymentsClient();

        // Resolve wallets
        const senderWalletDetails = await client.walletAddress.get({ url: grant.senderWallet });
        const receiverWalletDetails = await client.walletAddress.get({ url: grant.receiverWallet });

        // Request incoming-payment grant
        const incomingGrant = await client.grant.request(
            { url: receiverWalletDetails.authServer },
            { access_token: { access: [{ type: "incoming-payment", actions: ["create", "read", "complete"] }] } }
        );
        const incomingAccessToken = (incomingGrant as any).access_token?.value;
        if (!incomingAccessToken) throw new Error("Failed to get incoming-payment token");

        // Create incoming payment
        console.log(`[TEST EXEC] Creating incoming payment for ${amount}`);
        const incomingPayment = await client.incomingPayment.create(
            { url: receiverWalletDetails.resourceServer, accessToken: incomingAccessToken },
            {
                walletAddress: receiverWalletDetails.id,
                incomingAmount: { value: amount.toString(), assetCode: receiverWalletDetails.assetCode, assetScale: receiverWalletDetails.assetScale },
            }
        );

        // Create quote using the dedicated quote access token (not the outgoing-payment token)
        console.log(`[TEST EXEC] Creating quote...`);
        const quote = await client.quote.create(
            { url: senderWalletDetails.resourceServer, accessToken: quoteAccessToken },
            { walletAddress: senderWalletDetails.id, receiver: incomingPayment.id, method: "ilp" }
        );

        // Execute outgoing payment
        console.log(`[TEST EXEC] Executing outgoing payment via quote ${quote.id}`);

        try {
            const outgoingPayment = await client.outgoingPayment.create(
                { url: senderWalletDetails.resourceServer, accessToken: finalAccessToken },
                { walletAddress: senderWalletDetails.id, quoteId: quote.id }
            );

            console.log(`[TEST EXEC] ✅ Success! payment created: ${outgoingPayment.id}`);
            await adminDb.ref(`testing_grants/${grantId}`).update({ status: "executed" });

            return NextResponse.json({
                success: true,
                paymentId: outgoingPayment.id,
                grantSpentAmount: (outgoingPayment as any).grantSpentAmount?.value
            });
        } catch (payErr: any) {
            console.error(`[TEST EXEC] Outgoing payment failed:`, payErr.message || payErr);

            // Log diagnostic details
            throw payErr;
        }

    } catch (err: any) {
        console.error("[TEST EXEC] ERROR:", err);
        return NextResponse.json(
            {
                message: "Raw OpenPayments Error Payload",
                rawError: {
                    name: err.name,
                    code: err.code,
                    status: err.status,
                    description: err.description,
                    validationErrors: err.validationErrors,
                    message: err.message
                }
            },
            { status: 400 }
        );
    }
}
