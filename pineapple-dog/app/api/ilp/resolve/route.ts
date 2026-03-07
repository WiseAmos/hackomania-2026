import { NextRequest, NextResponse } from "next/server";
import { getOpenPaymentsClient, normalizeWalletUrl } from "../../../../lib/openPayments";
import { adminDb } from "../../../../lib/firebaseAdmin";
import crypto from "crypto";

/**
 * POST /api/ilp/resolve
 *
 * Resolves a wager: the winner's grant is cancelled, the loser's grant
 * is executed — 50% goes to the winner, 50% is retained in the fund pool.
 */
export async function POST(req: NextRequest) {
  console.log(">>> [RESOLVE] Settlement process started");
  try {
    const body = await req.json();
    const { wagerId, winnerId } = body;
    console.log(`>>> [RESOLVE] Target Wager: ${wagerId}, Target Winner: ${winnerId}`);

    if (!wagerId || !winnerId) {
      console.error(">>> [RESOLVE] Missing critical body params");
      return NextResponse.json({ message: "Missing wagerId or winnerId" }, { status: 400 });
    }

    const wagerRef = adminDb.ref(`wagers/${wagerId}`);
    const wagerSnap = await wagerRef.once("value");
    if (!wagerSnap.exists()) {
      console.error(`>>> [RESOLVE] Wager ${wagerId} not found in database`);
      return NextResponse.json({ message: "Wager not found" }, { status: 404 });
    }
    const wager = wagerSnap.val();
    console.log(`>>> [RESOLVE] Wager data fetched. Status: ${wager.status}, Type: ${wager.type}`);

    let actualWinnerUid = winnerId;
    if (winnerId === "player1" && wager.player1) actualWinnerUid = wager.player1.uid;
    if (winnerId === "player2" && wager.player2) actualWinnerUid = wager.player2.uid;
    console.log(`>>> [RESOLVE] Resolved actual winner UID: ${actualWinnerUid}`);

    const participants = wager.participants || [];
    const winnerP = participants.find((p: any) => p.uid === actualWinnerUid);
    console.log(`>>> [RESOLVE] Participants found: ${participants.length}. Winner participant object found: ${!!winnerP}`);

    if (!winnerP) {
      console.error(">>> [RESOLVE] Winner not found in participants array");
      return NextResponse.json({ message: "Winner participant not found in this wager" }, { status: 400 });
    }

    const client = await getOpenPaymentsClient();
    console.log(">>> [RESOLVE] OpenPayments client initialized");

    // 1. Cancel the winner's grant
    if (winnerP.grantId) {
      console.log(`>>> [RESOLVE] Attempting to cancel winner grant: ${winnerP.grantId}`);
      const snap = await adminDb.ref(`grants/${winnerP.grantId}`).once("value");
      if (snap.exists()) {
        await adminDb.ref(`grants/${winnerP.grantId}`).update({ status: "cancelled" });
        console.log(">>> [RESOLVE] Winner grant successfully marked as cancelled in Firebase");
      } else {
        console.warn(">>> [RESOLVE] Winner grant record not found in Firebase grants/ collection");
      }
    }

    const losers = participants.filter((p: any) => p.uid !== actualWinnerUid);
    console.log(`>>> [RESOLVE] Found ${losers.length} losers to process`);

    let totalPaidToWinner = 0;
    let totalAddedToPool = 0;

    // 2. Process each loser's stake
    for (const loserP of losers) {
      console.log(`>>> [RESOLVE] Processing loser: ${loserP.uid}`);

      let gid = loserP.grantId;
      if (!gid && loserP.uid === wager.player1?.uid) {
        gid = wager.grantId;
        console.log(`>>> [RESOLVE] Loser is creator, falling back to top-level grantId: ${gid}`);
      }

      if (!gid) {
        console.warn(`>>> [RESOLVE] No grantId found for participant ${loserP.uid}, skipping`);
        continue;
      }

      const snap = await adminDb.ref(`grants/${gid}`).once("value");
      if (!snap.exists()) {
        console.warn(`>>> [RESOLVE] Grant ${gid} not found in Firebase, skipping`);
        continue;
      }
      const grant = snap.val();

      if (grant.status !== "authorized") {
        console.warn(`>>> [RESOLVE] Grant ${gid} state invalid: ${grant.status}. Skipping payment.`);
        continue;
      }

      const totalAmount = Number(grant.amount || 0);
      if (totalAmount <= 0) {
        console.warn(`>>> [RESOLVE] Grant ${gid} has 0 or missing amount. Skipping.`);
        continue;
      }

      const halfAmount = Math.floor(totalAmount / 2);
      const poolAmount = totalAmount - halfAmount;
      console.log(`>>> [RESOLVE] Stake Split: ${totalAmount}c total. ${halfAmount}c to winner, ${poolAmount}c to pool`);

      // 3a. Execute payment to winner (50%)
      try {
        console.log(`>>> [RESOLVE] Initiating ILP Quote: ${loserP.walletAddress} -> ${winnerP.walletAddress}`);
        const winnerWalletAddress = normalizeWalletUrl(winnerP.walletAddress);
        const loserWalletAddress = normalizeWalletUrl(loserP.walletAddress);

        const winnerWallet = await client.walletAddress.get({ url: winnerWalletAddress });
        const loserWallet = await client.walletAddress.get({ url: loserWalletAddress });

        const quote = await client.quote.create(
          { url: loserWallet.resourceServer, accessToken: grant.continueToken },
          {
            walletAddress: loserWallet.id,
            receiver: winnerWallet.id,
            method: "ilp",
            debitAmount: { assetCode: "SGD", assetScale: 2, value: halfAmount.toString() },
          }
        );
        console.log(`>>> [RESOLVE] Quote created: ${quote.id}. Executing payment...`);

        await client.outgoingPayment.create(
          { url: loserWallet.resourceServer, accessToken: grant.continueToken },
          { walletAddress: loserWallet.id, quoteId: quote.id }
        );

        totalPaidToWinner += halfAmount;
        console.log(`>>> [RESOLVE] SUCCESS: Winner received ${halfAmount}c`);
      } catch (err) {
        console.error(`>>> [RESOLVE] ILP Failure (Winner Payout):`, err);
      }

      // 3b. Record pool refill (50%)
      if (poolAmount > 0) {
        const poolGrantId = crypto.randomUUID();
        console.log(`>>> [RESOLVE] Recording Pool Refill: ${poolAmount}c from ${loserP.uid}`);
        await adminDb.ref(`pool/grants/${poolGrantId}`).set({
          id: poolGrantId,
          sourceWagerId: wagerId,
          amount: poolAmount,
          continueToken: grant.continueToken,
          continueUri: grant.continueUri,
          interactRef: grant.interactRef,
          walletUrl: normalizeWalletUrl(loserP.walletAddress),
          status: "available",
          createdAt: new Date().toISOString()
        });
        totalAddedToPool += poolAmount;
      }

      await adminDb.ref(`grants/${gid}`).update({ status: "executed" });
    }

    // 4. Update Stats
    console.log(`>>> [RESOLVE] Finalizing stats. Total Winner Payout: ${totalPaidToWinner}, Total Pool Refill: ${totalAddedToPool}`);
    const tvlRef = adminDb.ref("pool/stats/totalValueLocked");
    const tvlSnap = await tvlRef.once("value");
    const currentTVL = tvlSnap.val() || 0;
    await tvlRef.set(Math.max(0, currentTVL - (totalPaidToWinner + totalAddedToPool)));

    await wagerRef.update({
      status: "resolved",
      winner: actualWinnerUid,
      resolvedAt: new Date().toISOString(),
      payouts: {
        winnerAmount: totalPaidToWinner,
        poolAmount: totalAddedToPool
      }
    });
    console.log(">>> [RESOLVE] Wager status updated to RESOLVED. Flow complete.");

    return NextResponse.json({
      success: true,
      didWin: actualWinnerUid,
      paidToWinner: totalPaidToWinner,
      addedToPool: totalAddedToPool
    });
  } catch (err) {
    console.error(">>> [RESOLVE] FATAL ERROR:", err);
    return NextResponse.json({ message: "Failed to resolve wager", error: String(err) }, { status: 500 });
  }
}
