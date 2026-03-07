import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

/**
 * GET /api/stats — returns platform-wide stats
 */
export async function GET() {
    try {
        const statsRef = adminDb.ref("pool/stats");
        const snap = await statsRef.once("value");

        const stats = snap.val() || {
            totalValueLocked: 0,
            totalReliefPaid: 0,
        };

        return NextResponse.json(stats);
    } catch (err) {
        console.error("[api/stats GET]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
