import { NextRequest, NextResponse } from "next/server";
import { getOpenPaymentsClient } from "../../../../lib/openPayments";
import { updateGrant, getGrant } from "../../../../lib/store";

/**
 * POST /api/ilp/interact
 *
 * Step 5 from Open Payments docs: Request a grant continuation.
 * After the user authorizes on Fynbos and is redirected back,
 * the frontend sends the interact_ref here. We immediately call
 * client.grant.continue() to finalize the grant and obtain
 * the final access token for future outgoing payments.
 *
 * Body: { grantId, interact_ref, hash }
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

        const grant = getGrant(grantId);
        if (!grant) {
            return NextResponse.json(
                { message: `Grant ${grantId} not found` },
                { status: 404 }
            );
        }

        // Step 5: Request a grant continuation (per Open Payments docs)
        // Issue the request to the continue.uri with the interact_ref
        const client = await getOpenPaymentsClient();
        const finalizedGrant = await client.grant.continue(
            {
                accessToken: grant.continueToken,
                url: grant.continueUri,
            },
            { interact_ref },
        );

        // Extract the final access token for future outgoing payments
        const finalAccessToken = (
            finalizedGrant as {
                access_token: { value: string; manage: string };
                continue: { access_token: { value: string }; uri: string };
            }
        ).access_token.value;

        const continuationUri = (
            finalizedGrant as {
                continue: { access_token: { value: string }; uri: string };
            }
        ).continue?.uri;

        const continuationToken = (
            finalizedGrant as {
                continue: { access_token: { value: string }; uri: string };
            }
        ).continue?.access_token?.value;

        // Update the stored grant with the finalized access token
        updateGrant(grantId, {
            interactRef: interact_ref,
            hash: hash || "",
            status: "authorized",
            // Store the final access token and updated continuation info
            continueToken: continuationToken || grant.continueToken,
            continueUri: continuationUri || grant.continueUri,
        });

        console.log(
            `[ilp/interact] Grant ${grantId} finalized with access token`
        );

        return NextResponse.json({
            success: true,
            accessToken: finalAccessToken,
        });
    } catch (err) {
        console.error("[ilp/interact] error:", err);
        return NextResponse.json(
            { message: "Failed to continue grant", error: String(err) },
            { status: 500 }
        );
    }
}
