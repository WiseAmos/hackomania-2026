import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

/**
 * GET /api/wagers?userId=xxx  — list wagers for a user (or all wagers)
 * POST /api/wagers             — create a new wager record in RTDB
 */
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId");
        if (!userId) {
            // Unauthenticated or not providing userId: return nothing.
            // Wagers should only be visible to involved users.
            return NextResponse.json([]);
        }

        const wagersRef = adminDb.ref("wagers");

        // Find where user is player1
        const snap1 = await wagersRef.orderByChild("player1/uid").equalTo(userId).once("value");
        const data: Record<string, unknown>[] = [];
        snap1.forEach((child) => {
            data.push({ id: child.key, ...child.val() });
        });

        // Find where user is player2
        const snap2 = await wagersRef.orderByChild("player2/uid").equalTo(userId).once("value");
        snap2.forEach((child) => {
            // Avoid duplicates if a user somehow played themselves
            if (!data.find((w: Record<string, unknown>) => w.id === child.key)) {
                data.push({ id: child.key, ...child.val() });
            }
        });

        // Sort by createdAt descending
        data.sort((a, b) => {
            const timeA = new Date((a.createdAt as string) || 0).getTime();
            const timeB = new Date((b.createdAt as string) || 0).getTime();
            return timeB - timeA;
        });

        return NextResponse.json(data);
    } catch (err) {
        console.error("[api/wagers GET]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, description, deadline, stakeAmount, player1, player2, grantId, wagerId } = body;

        if (!title || !stakeAmount || !player1) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const wagerData = {
            title,
            description: description || "",
            deadline: deadline || "",
            stakeAmount: Number(stakeAmount),
            timeRemaining: "",
            totalStake: Number(stakeAmount) * 2,
            player1: {
                uid: player1.uid || "",
                name: player1.name || "Player 1",
                avatar: player1.avatar || "?",
                handle: player1.handle || "",
                walletAddress: player1.walletAddress || "",
                status: "alive",
                stakedAmount: Number(stakeAmount),
            },
            player2: {
                uid: player2?.uid || "",
                name: player2?.name || "Opponent",
                avatar: player2?.avatar || "?",
                handle: player2?.handle || "",
                walletAddress: player2?.walletAddress || "",
                status: "alive",
                stakedAmount: Number(stakeAmount),
            },
            grantId: grantId || "",
            status: "active",
            winner: null,
            createdAt: new Date().toISOString(),
        };

        // Use provided wagerId or generate one
        const ref = wagerId
            ? adminDb.ref(`wagers/${wagerId}`)
            : adminDb.ref("wagers").push();

        await ref.set(wagerData);

        // Update platform stats
        const statsRef = adminDb.ref("pool/stats/totalValueLocked");
        const statsSnap = await statsRef.once("value");
        const currentTVL = statsSnap.val() || 0;
        await statsRef.set(currentTVL + Number(stakeAmount) * 2);

        return NextResponse.json({ id: ref.key, ...wagerData });
    } catch (err) {
        console.error("[api/wagers POST]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
