import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";

/**
 * POST /api/wagers/stake
 * Body: { wagerId, playerId, amount, backerUid }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wagerId, playerId, amount, backerUid } = body;

    if (!wagerId || !playerId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const wagerRef = adminDb.ref(`wagers/${wagerId}`);
    const snap = await wagerRef.once("value");

    if (!snap.exists()) {
      return NextResponse.json({ error: "Wager not found" }, { status: 404 });
    }

    const wager = snap.val();
    const stakeChange = Number(amount);

    // Update specific player stake
    let updated = false;
    if (wager.player1 && wager.player1.uid === playerId) {
      wager.player1.stakedAmount = (wager.player1.stakedAmount || 0) + stakeChange;
      updated = true;
    } else if (wager.player2 && wager.player2.uid === playerId) {
      wager.player2.stakedAmount = (wager.player2.stakedAmount || 0) + stakeChange;
      updated = true;
    }

    if (!updated) {
      return NextResponse.json({ error: "Player not found in this wager" }, { status: 400 });
    }

    // Update total stake
    wager.totalStake = (wager.totalStake || 0) + stakeChange;

    // Save back
    await wagerRef.set(wager);

    // Update global TVL in stats
    const statsRef = adminDb.ref("pool/stats/totalValueLocked");
    const statsSnap = await statsRef.once("value");
    const currentTVL = statsSnap.val() || 0;
    await statsRef.set(currentTVL + stakeChange);

    // Also record the individual backer interaction in a 'contributions' node for history/portfolio
    if (backerUid) {
      const contributionRef = adminDb.ref(`users/${backerUid}/contributions`).push();
      await contributionRef.set({
        wagerId,
        wagerTitle: wager.title,
        playerId,
        playerName: (wager.player1.uid === playerId ? wager.player1.name : wager.player2.name),
        amount: stakeChange,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, wager });
  } catch (err) {
    console.error("[api/wagers/stake POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
