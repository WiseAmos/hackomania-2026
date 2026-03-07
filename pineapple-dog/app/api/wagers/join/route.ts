import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";

/**
 * POST /api/wagers/join
 * Body: { wagerId, user: { uid, name, avatar, handle, walletAddress } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wagerId, user, grantId } = body;

    if (!wagerId || !user || !user.uid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const wagerRef = adminDb.ref(`wagers/${wagerId}`);
    const snap = await wagerRef.once("value");

    if (!snap.exists()) {
      return NextResponse.json({ error: "Wager not found" }, { status: 404 });
    }

    const wager = snap.val();

    // Check if already a participant
    const participants: any[] = wager.participants || [];
    const existingIndex = participants.findIndex((p: any) => p.uid === user.uid);
    const alreadyInLegacy = (wager.player1 && wager.player1.uid === user.uid) ||
      (wager.player2 && wager.player2.uid === user.uid);
    const isAlreadyJoined = existingIndex !== -1 || alreadyInLegacy;

    if (isAlreadyJoined) {
      // If they're already in, just update their grantId if it's missing
      if (existingIndex !== -1 && (!participants[existingIndex].grantId || participants[existingIndex].grantId === "")) {
        console.log(`[wagers/join] Participant ${user.uid} already exists — updating missing grantId to: ${grantId}`);
        participants[existingIndex] = {
          ...participants[existingIndex],
          grantId: grantId || "",
          stakedAmount: Number(wager.stakeAmount || 0),
          updatedAt: new Date().toISOString(),
        };
        await wagerRef.update({ participants });
        return NextResponse.json({ success: true, updated: true });
      }
      return NextResponse.json({ error: "Already joined this challenge" }, { status: 400 });
    }

    // Add as new participant
    const newParticipant = {
      uid: user.uid,
      name: user.name,
      avatar: user.avatar,
      handle: user.handle,
      walletAddress: user.walletAddress || "",
      grantId: grantId || "",
      status: "alive",
      stakedAmount: Number(wager.stakeAmount || 0),
      joinedAt: new Date().toISOString()
    };

    participants.push(newParticipant);
    wager.participants = participants;

    // Update total stake
    wager.totalStake = (Number(wager.totalStake) || 0) + Number(wager.stakeAmount || 0);

    await wagerRef.set(wager);

    // Update platform stats
    const statsRef = adminDb.ref("pool/stats/totalValueLocked");
    const statsSnap = await statsRef.once("value");
    const currentTVL = statsSnap.val() || 0;
    await statsRef.set(currentTVL + Number(wager.stakeAmount || 0));

    return NextResponse.json({ success: true, wager });
  } catch (err) {
    console.error("[api/wagers/join POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
