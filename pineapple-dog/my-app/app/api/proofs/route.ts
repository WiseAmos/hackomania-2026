import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

/**
 * GET /api/proofs?wagerId=xxx  — list proof posts (optionally by wager)
 * POST /api/proofs              — submit a new proof of progress
 */
export async function GET(req: NextRequest) {
    try {
        const wagerId = req.nextUrl.searchParams.get("wagerId");
        const proofsRef = adminDb.ref("proofs");

        let snap;
        if (wagerId) {
            snap = await proofsRef.orderByChild("wagerId").equalTo(wagerId).once("value");
        } else {
            snap = await proofsRef.orderByChild("createdAt").limitToLast(50).once("value");
        }

        const data: Record<string, unknown>[] = [];
        snap.forEach((child) => {
            data.push({ id: child.key, ...child.val() });
        });

        return NextResponse.json(data.reverse());
    } catch (err) {
        console.error("[api/proofs GET]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, userName, userAvatar, userHandle, wagerId, wagerTitle, photoUrl, caption } = body;

        if (!userId || !wagerId || !caption) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const proofData = {
            user: {
                id: userId,
                name: userName || "Anonymous",
                avatar: userAvatar || "?",
                handle: userHandle || "",
            },
            wager: {
                id: wagerId,
                title: wagerTitle || "Untitled",
            },
            photoUrl: photoUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
            caption,
            timestamp: new Date().toISOString(),
            verifications: 0,
            rejections: 0,
            createdAt: new Date().toISOString(),
        };

        const ref = adminDb.ref("proofs").push();
        await ref.set(proofData);

        return NextResponse.json({ id: ref.key, ...proofData });
    } catch (err) {
        console.error("[api/proofs POST]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
