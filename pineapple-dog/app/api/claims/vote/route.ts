import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";

import { VOTE_THRESHOLD } from "../../../../src/utils/voting";

export async function POST(req: NextRequest) {
    try {
        const { claimId, userId, sync } = await req.json();

        if (!claimId || (!userId && !sync)) {
            return NextResponse.json({ error: "Missing claimId or userId" }, { status: 400 });
        }

        const votesRef = adminDb.ref(`claims/${claimId}/claim_manifest/votes`);
        const claimRef = adminDb.ref(`claims/${claimId}`);

        let payoutTriggered = false;
        let payoutResult = null;

        // 1. Resolve Atomic Vote Transaction (Skip if it's just a sync check)
        if (!sync) {
            await votesRef.transaction((currentVotes: any) => {
                if (!currentVotes) {
                    return { count: 1, voterIds: [userId] };
                }

                const voterIds = currentVotes.voterIds || [];
                const hasVoted = voterIds.includes(userId);

                if (hasVoted) {
                    // Remove Vote
                    return {
                        count: Math.max(0, (currentVotes.count || 0) - 1),
                        voterIds: voterIds.filter((id: string) => id !== userId)
                    };
                } else {
                    // Add Vote
                    return {
                        count: (currentVotes.count || 0) + 1,
                        voterIds: [...voterIds, userId]
                    };
                }
            });
        }

        // 2. Refresh Claim and Evaluate against Threshold
        const snap = await claimRef.once("value");
        const claim = snap.val();
        
        if (!claim) {
            return NextResponse.json({ error: "Claim not found after vote" }, { status: 404 });
        }

        const voteCount = claim.claim_manifest?.votes?.count || 0;
        const currentDisbursementStatus = claim.verification_results?.disbursement?.status;
        const topLevelStatus = claim.status;
        const currentPercentage = claim.verification_results?.disbursement?.payout_percentage || 0;

        // A claim is "ready for disbursement" if it hasn't been fully disbursed yet 
        // AND it's not a Tier 1 (which is auto-disbursed anyway)
        const isDisbursed = currentDisbursementStatus === "DISBURSED" || topLevelStatus === "fulfilled";
        const needsConsensus = claim.verification_results?.triage_tier !== 1;

        console.log(`[Consensus Check] ID: ${claimId} | Votes: ${voteCount}/${VOTE_THRESHOLD} | Status: ${topLevelStatus} | Current: ${currentPercentage}% | Needs Consensus: ${needsConsensus}`);

        if (voteCount >= VOTE_THRESHOLD && !isDisbursed && needsConsensus) {
            console.log(`[Consensus Check] Threshold passed! Executing disbursement flow...`);
            
            const totalAmount = claim.amount || claim.claim_manifest?.amount_requested;
            const claimantWallet = claim.claimantWallet;

            // Calculate remaining percentage to pay (e.g. 100 - 20 = 80 for Tier 2, or 100 - 0 = 100 for Tier 3)
            const remainingPercentage = 100 - currentPercentage;

            if (claimantWallet && totalAmount && remainingPercentage > 0) {
                try {
                    // Internal payout via ILP service
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
                    console.log(`[ILP Dispatch] URL: ${baseUrl}/api/ilp/claim | Wallet: ${claimantWallet} | Remaining%: ${remainingPercentage}`);

                    const ilpRes = await fetch(`${baseUrl}/api/ilp/claim`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            claimantWallet,
                            // (Total Amount * Remaining%) in cents
                            amount: Math.round(Number(totalAmount) * remainingPercentage).toString(),
                            description: claim.reliefFund || "Community Consensus Verification Payment",
                        }),
                    });
                    
                    payoutResult = await ilpRes.json();
                    
                    if (payoutResult.success || (payoutResult.totalPaid && payoutResult.totalPaid > 0)) {
                        payoutTriggered = true;
                        
                        // 3. Finalize Status across the board
                        await claimRef.update({
                            status: "fulfilled",
                            updated_at: new Date().toISOString(),
                            amountPaid: Number(totalAmount), // Fully paid now
                            "verification_results/disbursement/status": "DISBURSED",
                            "verification_results/disbursement/payout_percentage": 100,
                            grantsUsed: [
                                ...(claim.grantsUsed || []),
                                ...(payoutResult.payments || [])
                            ],
                            consensusTimestamp: new Date().toISOString()
                        });

                        // 4. Update Platform Statistics
                        const statsRef = adminDb.ref("pool/stats/totalReliefPaid");
                        const statsSnap = await statsRef.once("value");
                        const currentPaidValue = statsSnap.val() || 0;
                        // Add the NEWLY paid amount
                        const newlyPaid = (Number(totalAmount) * remainingPercentage) / 100;
                        await statsRef.set(currentPaidValue + newlyPaid);

                        console.log(`[Consensus Check] SUCCESS. Claim ${claimId} marked as DISBURSED.`);
                    } else {
                        console.error(`[Consensus Check] ILP Payout reported failure:`, payoutResult);
                    }
                } catch (dispatchErr) {
                    console.error("[Consensus Check] Failed to dispatch ILP request:", dispatchErr);
                }
            } else {
                console.warn(`[Consensus Check] Logic blocked. Reason: ${!claimantWallet ? 'Missing Wallet' : !totalAmount ? 'Missing Amount' : 'Zero Remaining Percentage'}. Wallet: ${claimantWallet}, Amount: ${totalAmount}, Remaining%: ${remainingPercentage}`);
            }
        }

        return NextResponse.json({
            success: true,
            voteCount,
            payoutTriggered,
            status: isDisbursed ? "DISBURSED" : "PENDING"
        });

    } catch (err: any) {
        console.error("[Vote API Critical Error]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
