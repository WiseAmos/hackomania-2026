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

    // Extract the final access token and updated continuation info
    const continuationUri = (finalizedGrant as any).continue?.uri;
    const continuationToken = (finalizedGrant as any).continue?.access_token?.value;

    // Update the stored grant with the finalized info
    const updates = {
      interactRef: interact_ref,
      hash: hash || "",
      status: "authorized" as const,
      continueToken: continuationToken || grant.continueToken,
      continueUri: continuationUri || grant.continueUri,
    };

    // Persist to Firebase
    await adminDb.ref(`grants/${grantId}`).update(updates);

    console.log(`[ilp/interact] Grant ${grantId} finalized and updated in Firebase`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ilp/interact] error:", err);
    return NextResponse.json(
      { message: "Failed to continue grant", error: String(err) },
      { status: 500 }
    );
  }
}
