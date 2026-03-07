import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

/**
 * GET /api/wagers?userId=xxx  — list wagers for a user (or all wagers)
 * POST /api/wagers             — create a new wager record in RTDB
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const wagersRef = adminDb.ref("wagers");
    const data: Record<string, unknown>[] = [];

    if (!userId) {
      // Global Arena: return all wagers
      const snap = await wagersRef.once("value");
      snap.forEach((child) => {
        data.push({ id: child.key, ...child.val() });
      });
    } else {
      // My Wagers: search across all as Firebase doesn't support deep array query easily
      const snap = await wagersRef.once("value");
      snap.forEach((child) => {
        const wager = child.val();
        const isParticipant = (wager.participants || []).some((p: any) => p.uid === userId) ||
          wager.player1?.uid === userId ||
          wager.player2?.uid === userId;
        if (isParticipant) {
          data.push({ id: child.key, ...wager });
        }
      });
    }

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
    const {
      title, description, deadline, poolExpiry,
      stakeAmount, player1, player2, grantId,
      wagerId, imageUrl, type, isStreak, participants
    } = body;

    if (!title || !stakeAmount || !player1) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Normalize participants — always ensure grantId is present per player
    let normalizedParticipants: any[];
    if (Array.isArray(participants) && participants.length > 0) {
      // Use provided array, but ensure the first participant (creator) gets the grantId if missing
      normalizedParticipants = participants.map((p: any, i: number) => ({
        uid: p.uid || "",
        name: p.name || "",
        avatar: p.avatar || "",
        handle: p.handle || "",
        walletAddress: p.walletAddress || "",
        // Creator gets the grantId from the top-level param if their entry is missing it
        grantId: p.grantId || (i === 0 ? (grantId || "") : ""),
        status: p.status || "alive",
        stakedAmount: Number(p.stakedAmount || stakeAmount || 0),
        joinedAt: p.joinedAt || new Date().toISOString(),
      }));
    } else {
      // Fallback: build participant from player1 + grantId
      normalizedParticipants = [{
        uid: player1.uid || "",
        name: player1.name || "Creator",
        avatar: player1.avatar || "",
        handle: player1.handle || "",
        walletAddress: player1.walletAddress || "",
        grantId: grantId || "",          // ← stored PER PLAYER, not top-level
        status: "alive",
        stakedAmount: Number(stakeAmount),
        joinedAt: new Date().toISOString(),
      }];
    }

    const wagerData = {
      title,
      description: description || "",
      deadline: deadline || "",
      poolExpiry: poolExpiry || "",
      stakeAmount: Number(stakeAmount),
      imageUrl: imageUrl || "",
      timeRemaining: "",
      type: type || "competitive",
      isStreak: !!isStreak,
      totalStake: Number(stakeAmount) * normalizedParticipants.length,
      player1: player1 || null,
      player2: player2 || null,
      participants: normalizedParticipants,
      // NOTE: NO top-level grantId — each participant owns their own grant
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
    await statsRef.set(currentTVL + wagerData.totalStake);

    return NextResponse.json({ id: ref.key, ...wagerData });
  } catch (err) {
    console.error("[api/wagers POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
