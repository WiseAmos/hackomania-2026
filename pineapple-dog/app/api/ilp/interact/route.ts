import { NextRequest, NextResponse } from "next/server";
import { getOpenPaymentsClient } from "../../../../lib/openPayments";
import { adminDb } from "../../../../lib/firebaseAdmin";

/**
 * POST /api/ilp/interact
 *
 * Finalizes an Interledger grant authorization.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grantId, interact_ref, hash } = body;

    if (!grantId || !interact_ref) {
      return NextResponse.json(
        { message: "Missing grantId or interact_ref" },
        { status: 400 }
      );
    }

    // EXCLUSIVELY fetch from Firebase
    const snap = await adminDb.ref(`grants/${grantId}`).once("value");
    if (!snap.exists()) {
      return NextResponse.json(
        { message: `Grant ${grantId} not found in Firebase` },
        { status: 404 }
      );
    }
    const grant = snap.val();

    // Step 5: Request a grant continuation (per Open Payments docs)
    const client = await getOpenPaymentsClient();
    const finalizedGrant = await client.grant.continue(
      {
        accessToken: grant.continueToken,
        url: grant.continueUri,
      },
      { interact_ref },
    );

    // Extract tokens from the finalized grant response.
    // Open Payments returns TWO different tokens:
    //   - access_token.value      → the PAYMENT token (use for quote, outgoingPayment)
    //   - continue.access_token.value → the CONTINUATION token (use for further grant.continue() calls)
    const paymentAccessToken = (finalizedGrant as any).access_token?.value;
    const continuationToken = (finalizedGrant as any).continue?.access_token?.value;
    const continuationUri = (finalizedGrant as any).continue?.uri;

    console.log(`[ilp/interact] Grant ${grantId} — payment token: ${paymentAccessToken ? "✓" : "✗"}, continue token: ${continuationToken ? "✓" : "✗"}`);

    if (!paymentAccessToken) {
      console.warn(`[ilp/interact] WARNING: No payment access token returned for grant ${grantId}. The wallet may not have issued one.`);
    }

    // Update the stored grant with both tokens
    const updates = {
      interactRef: interact_ref,
      hash: hash || "",
      status: "authorized" as const,
      // The token used for actual payments (quote.create, outgoingPayment.create)
      accessToken: paymentAccessToken || "",
      // The token used for future grant.continue() calls
      continueToken: continuationToken || grant.continueToken,
      continueUri: continuationUri || grant.continueUri,
    };

    // Persist to Firebase
    await adminDb.ref(`grants/${grantId}`).update(updates);

    console.log(`[ilp/interact] Grant ${grantId} finalized and persisted to Firebase`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ilp/interact] error:", err);
    return NextResponse.json(
      { message: "Failed to continue grant", error: String(err) },
      { status: 500 }
    );
  }
}
