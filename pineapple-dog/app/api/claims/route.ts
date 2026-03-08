import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";
import { PDLEngine, ClaimManifest } from "../../../lib/verification";
import { VOTE_THRESHOLD } from "../../../src/utils/voting";

/**
 * GET /api/claims?userId=xxx  — list impact claims
 * POST /api/claims             — submit a relief claim
 */
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId");
        const claimsRef = adminDb.ref("claims");

        let snap;
        if (userId) {
            snap = await claimsRef.orderByChild("userId").equalTo(userId).once("value");
        } else {
            snap = await claimsRef.orderByChild("createdAt").limitToLast(50).once("value");
        }

        const data: any[] = [];
        snap.forEach((child: any) => {
            const claim = child.val();
            const claimId = child.key;
            
            // --- Robust Community Consensus Auto-Disbursement ---
            // If the claim is already community-verified (Threshold met) 
            // but not yet marked fulfilled, we trigger the sync.
            const voteCount = claim.claim_manifest?.votes?.count || 0;
            const status = claim.status;
            const triageTier = claim.verification_results?.triage_tier;
            const needsConsensus = triageTier !== 1;
            const isDisbursed = status === "fulfilled" || status === "DISBURSED";

            // If it has enough votes but isn't disbursed yet, we trigger the disbursement flow.
            // We do this in an async background task so we don't block the GET response.
            if (voteCount >= VOTE_THRESHOLD && !isDisbursed && needsConsensus && claimId) {
                (async () => {
                    try {
                        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
                        await fetch(`${baseUrl}/api/claims/vote`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ claimId, sync: true }),
                        });
                    } catch (e) {
                         console.warn(`[Consensus Sync-Thread] Failed to auto-disburse verified claim ${claimId}:`, e);
                    }
                })();
            }

            data.push({ id: claimId, ...claim });
        });

        return NextResponse.json(data.reverse());
    } catch (err) {
        console.error("[api/claims GET]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            userId, amount, description, reliefFund, wagerTitle,
            recipientName, recipientAvatar, recipientBio, claimantWallet,
            disaster_info, selected_category, category_details
        } = body;

        if (!userId || !amount || !reliefFund) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if user is KYC verified
        const userRef = adminDb.ref(`users/${userId}`);
        const userSnap = await userRef.once("value");
        if (!userSnap.exists()) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userSnap.val();
        if (!userData.kycVerified) {
            return NextResponse.json({
                error: "KYC verification required to upload claims. Please complete your profile and upload identity documents."
            }, { status: 403 });
        }

        const claimData = {
            userId,
            amount: Number(amount),
            description: description || "",
            reliefFund,
            wagerTitle: wagerTitle || "",
            recipient: {
                name: recipientName || "Relief Fund",
                avatar: recipientName?.charAt(0) || "R",
                bio: recipientBio || "Providing aid to communities in need.",
            },
            claimantWallet: claimantWallet || "",
            status: "verifying",
            grantsUsed: [],
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            disaster_info: disaster_info || null
        };

        const ref = adminDb.ref("claims").push();
        const claimId = ref.key;
        await ref.set(claimData);

        // --- Automated Verification Flow ---
        let verificationResponse = null;
        try {
            const engine = new PDLEngine();
            const manifest: ClaimManifest = {
                claim_id: claimId!,
                submission_date: claimData.createdAt,
                disaster_info: disaster_info || {
                    name: reliefFund,
                    date: new Date().toISOString().split('T')[0],
                    details: description || "No additional details provided."
                },
                title: wagerTitle || "Relief Claim",
                description: description || "",
                amount_requested: Number(amount),
                selected_category: selected_category || "OTHER",
                category_details: category_details || {},
                votes: { count: 0, voterIds: [] }
            };

            verificationResponse = await engine.processClaim(manifest);
            // Engine already updates the claim in DB via saveTokenToDb
        } catch (verifErr) {
            console.error("[api/claims] Verification failed:", verifErr);
            await ref.update({ status: "pending_review" });
        }

        // If verified (Tier 1 or 2) and a claimant wallet is provided, attempt ILP payout
        const payoutPercentage = verificationResponse?.verification_results.disbursement.payout_percentage || 0;
        const isVerified = payoutPercentage > 0;

        if (isVerified && claimantWallet) {
            try {
                // ILP expects cents. (dollars * percentage) is the correct cent amount if percentage is an integer 1-100.
                const payoutAmountCents = Math.round(Number(amount) * payoutPercentage);
                
                const ilpRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/ilp/claim`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        claimantWallet,
                        amount: payoutAmountCents.toString(),
                        description: reliefFund,
                    }),
                });
                const ilpData = await ilpRes.json();
                
                // If it's a full payment (Tier 1), status is fulfilled.
                // If it's a partial payment (Tier 2), status is partial.
                const newStatus = ilpData.success ? (payoutPercentage >= 100 ? "fulfilled" : "partial") : "pending_payout";

                await ref.update({ 
                    status: newStatus, 
                    grantsUsed: ilpData.payments || [],
                    amountPaid: ilpData.success ? (Number(amount) * payoutPercentage / 100) : 0
                });
            } catch (ilpErr) {
                console.error("[api/claims] ILP payout failed:", ilpErr);
                await ref.update({ status: "pending_payout" });
            }
        }

        // Update total relief paid stat if any amount was paid
        const finalSnap = await ref.once("value");
        const finalData = finalSnap.val();
        const paidSoFar = finalData.amountPaid || 0;
        
        if (paidSoFar > 0) {
            const statsRef = adminDb.ref("pool/stats/totalReliefPaid");
            const statsSnap = await statsRef.once("value");
            const currentTotal = statsSnap.val() || 0;
            await statsRef.set(currentTotal + paidSoFar);
        }

        return NextResponse.json({ id: claimId, ...claimData, verification: verificationResponse });
    } catch (err) {
        console.error("[api/claims POST]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
