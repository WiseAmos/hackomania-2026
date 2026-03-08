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

      const halfAmount = Math.floor(totalAmount / 10);
      const poolAmount = totalAmount - halfAmount;
      console.log(`>>> [RESOLVE] Stake Split: ${totalAmount}c total. ${halfAmount}c to winner, ${poolAmount}c to pool`);

      // 3a. Execute payment to winner using correct Open Payments protocol:
      //     Step 1: Get non-interactive grant to create incoming payment at winner's wallet
      //     Step 2: Create incoming payment specifying the amount
      //     Step 3: Quote loser → winner using the incoming payment URL as receiver
      //     Step 4: Execute outgoing payment from loser's wallet
      try {
        const loserWalletUrl: string = grant.walletUrl || normalizeWalletUrl(loserP.walletAddress || "");

        // Resolve the winner's walletUrl from their grant record
        let winnerWalletUrl: string = "";
        if (winnerP.grantId) {
          const winnerGrantSnap = await adminDb.ref(`grants/${winnerP.grantId}`).once("value");
          if (winnerGrantSnap.exists()) winnerWalletUrl = winnerGrantSnap.val().walletUrl || "";
        }
        if (!winnerWalletUrl && wager.grantId) {
          const creatorGrantSnap = await adminDb.ref(`grants/${wager.grantId}`).once("value");
          if (creatorGrantSnap.exists()) winnerWalletUrl = creatorGrantSnap.val().walletUrl || "";
        }
        if (!winnerWalletUrl) winnerWalletUrl = normalizeWalletUrl(winnerP.walletAddress || "");

        console.log(`>>> [RESOLVE] Wallet URLs — Loser: "${loserWalletUrl}", Winner: "${winnerWalletUrl}"`);

        if (!loserWalletUrl || !winnerWalletUrl) {
          throw new Error(`Missing wallet URL — loser: "${loserWalletUrl}", winner: "${winnerWalletUrl}"`);
        }
        if (loserWalletUrl === winnerWalletUrl) {
          console.warn(`>>> [RESOLVE] WARNING: Loser and winner have the same wallet URL (${winnerWalletUrl}). This indicates a data issue where grants were not stored per-player. Skipping self-payment.`);
          throw new Error("Same wallet for loser and winner — payment aborted to prevent self-transfer");
        }

        const winnerWallet = await client.walletAddress.get({ url: winnerWalletUrl });
        const loserWallet = await client.walletAddress.get({ url: loserWalletUrl });
        console.log(`>>> [RESOLVE] Wallets resolved — Loser: ${loserWallet.id}, Winner: ${winnerWallet.id}`);

        // Step 1: Request a non-interactive grant to create an incoming payment at winner's wallet
        console.log(`>>> [RESOLVE] Requesting incoming-payment grant at winner's auth server: ${winnerWallet.authServer}`);
        const incomingGrant = await client.grant.request(
          { url: winnerWallet.authServer },
          {
            access_token: {
              access: [{ type: "incoming-payment", actions: ["create", "read", "complete"] }],
            },
          }
        );
        const incomingAccessToken = (incomingGrant as any).access_token?.value;
        if (!incomingAccessToken) throw new Error("Failed to get incoming-payment access token for winner's wallet");

        // Step 2: Create an incoming payment at the winner's wallet for exactly halfAmount
        console.log(`>>> [RESOLVE] Creating incoming payment at winner's wallet for ${halfAmount}c`);
        const incomingPayment = await client.incomingPayment.create(
          { url: winnerWallet.resourceServer, accessToken: incomingAccessToken },
          {
            walletAddress: winnerWallet.id,
            incomingAmount: { value: halfAmount.toString(), assetCode: "SGD", assetScale: 2 },
          }
        );
        console.log(`>>> [RESOLVE] Incoming payment created: ${incomingPayment.id}`);

        // Step 3: Create quote from loser → incoming payment URL (no debitAmount needed)
        // IMPORTANT: use grant.accessToken (the payment token), NOT grant.continueToken
        const paymentToken = grant.accessToken;
        if (!paymentToken) {
          throw new Error(
            `Grant ${gid} has no accessToken. The grant was likely authorized before the token-extraction fix. ` +
            `The user needs to re-authorize their stake to get a fresh payment token.`
          );
        }
        const quoteToken = grant.quoteAccessToken;
        if (!quoteToken) {
          throw new Error(
            `Grant ${gid} has no quoteAccessToken. The user needs to re-authorize their stake to get a fresh grant with quote access.`
          );
        }
        console.log(`>>> [RESOLVE] Using quote token for quote, payment token for outgoing payment`);

        // Idempotency: skip if an outgoing payment was already created for this grant
        if (grant.outgoingPaymentId) {
          console.log(`>>> [RESOLVE] Outgoing payment already exists for grant ${gid}: ${grant.outgoingPaymentId}. Skipping re-creation.`);
          totalPaidToWinner += halfAmount;
        } else {
          const quote = await client.quote.create(
            { url: loserWallet.resourceServer, accessToken: quoteToken },
            {
              walletAddress: loserWallet.id,
              receiver: incomingPayment.id,
              method: "ilp",
            }
          );
          console.log(`>>> [RESOLVE] Quote created: ${quote.id}. Executing outgoing payment...`);

          // Step 4: Execute the outgoing payment
          const outgoingPayment = await client.outgoingPayment.create(
            { url: loserWallet.resourceServer, accessToken: paymentToken },
            { walletAddress: loserWallet.id, quoteId: quote.id }
          );

          // Store the outgoing payment ID so retries don't create a second payment
          await adminDb.ref(`grants/${gid}`).update({ outgoingPaymentId: outgoingPayment.id });

          totalPaidToWinner += halfAmount;
          console.log(`>>> [RESOLVE] SUCCESS: ${halfAmount}c transferred from loser to winner (payment: ${outgoingPayment.id})`);
        }
      } catch (err: any) {
        const errDescription = err?.description || err?.message || String(err);
        if (errDescription === 'Insufficient Grant') {
          console.error(
            `>>> [RESOLVE] INSUFFICIENT GRANT for ${loserP.uid}. ` +
            `Their grant (${gid}) was created with a debitAmount limit that has been exhausted by ` +
            `previous PENDING payment attempts. They must re-authorize with a fresh stake grant.`
          );
          // Mark this grant as exhausted in Firebase so the UI can prompt re-authorization
          await adminDb.ref(`grants/${gid}`).update({ status: "limit_exhausted" });
          // Also clear the grantId from the participant so the UI shows the re-auth modal
          const wagerSnap2 = await adminDb.ref(`wagers/${wagerId}`).once("value");
          if (wagerSnap2.exists()) {
            const wagerData2 = wagerSnap2.val();
            const updatedParticipants = (wagerData2.participants || []).map((p: any) => {
              if (p.uid === loserP.uid) return { ...p, grantId: "" };
              return p;
            });
            await adminDb.ref(`wagers/${wagerId}`).update({ participants: updatedParticipants });
          }
          throw err; // Unmasking the error by throwing it
        } else {
          console.error(`>>> [RESOLVE] ILP Failure (Winner Payout):`, err);
          throw err; // Unmasking the error by throwing it
        }
      }

      // 3b. Record pool refill (50%)
      if (poolAmount > 0) {
        const poolGrantId = crypto.randomUUID();
        console.log(`>>> [RESOLVE] Recording Pool Refill: ${poolAmount}c from ${loserP.uid}`);
        await adminDb.ref(`pool/grants/${poolGrantId}`).set({
          id: poolGrantId,
          sourceWagerId: wagerId,
          amount: poolAmount,
          accessToken: grant.accessToken || "",
          quoteAccessToken: grant.quoteAccessToken || "",
          continueToken: grant.continueToken,
          continueUri: grant.continueUri,
          interactRef: grant.interactRef,
          walletUrl: grant.walletUrl || normalizeWalletUrl(loserP.walletAddress || ""),
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
