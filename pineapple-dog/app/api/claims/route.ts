import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

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

        const data: Record<string, unknown>[] = [];
        snap.forEach((child) => {
            data.push({ id: child.key, ...child.val() });
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
        const { userId, amount, description, reliefFund, wagerTitle, recipientName, recipientAvatar, recipientBio, claimantWallet } = body;

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
            status: "pending",
            grantsUsed: [],
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };

        const ref = adminDb.ref("claims").push();
        await ref.set(claimData);

        // If a claimant wallet is provided, attempt ILP payout
        if (claimantWallet) {
            try {
                const ilpRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/ilp/claim`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        claimantWallet,
                        amount: Math.round(Number(amount) * 100).toString(),
                        description: reliefFund,
                    }),
                });
                const ilpData = await ilpRes.json();
                await ref.update({ status: ilpData.success ? "fulfilled" : "partial", grantsUsed: ilpData.payments || [] });
            } catch (ilpErr) {
                console.error("[api/claims] ILP payout failed:", ilpErr);
                await ref.update({ status: "pending_payout" });
            }
        }

        // Update total relief paid stat
        const statsRef = adminDb.ref("pool/stats/totalReliefPaid");
        const statsSnap = await statsRef.once("value");
        const currentPaid = statsSnap.val() || 0;
        await statsRef.set(currentPaid + Number(amount));

        return NextResponse.json({ id: ref.key, ...claimData });
    } catch (err) {
        console.error("[api/claims POST]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
