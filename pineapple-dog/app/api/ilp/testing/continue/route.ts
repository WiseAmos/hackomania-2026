import { NextRequest, NextResponse } from "next/server";
import { getOpenPaymentsClient } from "../../../../../lib/openPayments";
import { adminDb } from "../../../../../lib/firebaseAdmin";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { grantId, interactRef } = body;

        if (!grantId || !interactRef) {
            return NextResponse.json({ message: "Missing grantId or interactRef" }, { status: 400 });
        }

        // 1. Fetch the stored testing grant
        const snap = await adminDb.ref(`testing_grants/${grantId}`).once("value");
        if (!snap.exists()) {
            return NextResponse.json({ message: "Testing grant not found" }, { status: 404 });
        }
        const grant = snap.val();

        if (grant.status === "authorized") {
            return NextResponse.json({ success: true, message: "Grant already continued" });
        }

        if (grant.status !== "pending") {
            return NextResponse.json({ message: `Grant invalid state (status: ${grant.status})` }, { status: 400 });
        }

        const client = await getOpenPaymentsClient();

        // 2. Continue the interactive grant
        console.log(`[TEST CONT] Continuing grant ${grantId} with interact_ref: ${interactRef}`);
        const continuedGrant = await client.grant.continue(
            {
                accessToken: grant.continueToken,
                url: grant.continueUri,
            },
            {
                interact_ref: interactRef,
            }
        );

        const finalAccessToken = (continuedGrant as any).access_token?.value;
        if (!finalAccessToken) {
            throw new Error("Continuation failed: No access_token returned");
        }

        console.log(`[TEST CONT] Grant Continued! Final Access Token obtained.`);

        // 3. Store the finalAccessToken and update status
        await adminDb.ref(`testing_grants/${grantId}`).update({
            status: "authorized",
            finalAccessToken: finalAccessToken
        });

        return NextResponse.json({
            success: true,
            message: "Grant successfully authorized and token saved."
        });

    } catch (err: any) {
        console.error("[TEST CONT] FATAL ERROR:", err);
        return NextResponse.json(
            { message: "Failed to continue grant", error: String(err) },
            { status: 500 }
        );
    }
}
