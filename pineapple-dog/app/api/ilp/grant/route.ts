import { NextRequest, NextResponse } from "next/server";
import { isPendingGrant } from "@interledger/open-payments";
import { adminDb } from "../../../../lib/firebaseAdmin";
import {
  getOpenPaymentsClient,
  generateNonce,
  normalizeWalletUrl,
} from "../../../../lib/openPayments";
import { addGrant, addWager } from "../../../../lib/store";
import crypto from "crypto";

/**
 * GET /api/ilp/grant
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const walletAddress = searchParams.get("walletAddress");
  const amount = searchParams.get("amount");
  const player = searchParams.get("player") ?? "player1";
  const title = searchParams.get("title") ?? "Untitled Showdown";
  const description = searchParams.get("description") ?? "";
  const deadline = searchParams.get("deadline") ?? "";
  const opponentWallet = searchParams.get("opponentWallet") ?? "";
  let wagerId = searchParams.get("wagerId");

  if (!walletAddress || !amount) {
    return NextResponse.json(
      { message: "Missing walletAddress or amount" },
      { status: 400 }
    );
  }

  try {
    const client = await getOpenPaymentsClient();
    const NONCE = generateNonce();
    const walletUrl = normalizeWalletUrl(walletAddress);

    const wallet = await client.walletAddress.get({ url: walletUrl });

    // Generate a new Wager ID if none exists BEFORE configuring the redirect URI
    if (!wagerId || wagerId === "NEW") {
      wagerId = crypto.randomUUID();
    }

    const urlObj = new URL(req.url);
    const dynamicBaseUrl = `${urlObj.protocol}//${urlObj.host}`;

    // Request an interactive outgoing payment grant
    const grant = await client.grant.request(
      { url: wallet.authServer },
      {
        access_token: {
          access: [
            {
              identifier: wallet.id,
              type: "outgoing-payment",
              actions: ["read", "create"],
              limits: {
                debitAmount: {
                  assetCode: "SGD",
                  assetScale: 2,
                  value: amount,
                },
              },
            },
          ],
        },
        interact: {
          start: ["redirect"],
          finish: {
            method: "redirect",
            uri: `${dynamicBaseUrl}${player === "participant" ? "/dashboard" : "/wager"}?player=${player}&wagerId=${wagerId}`,
            nonce: NONCE,
          },
        },
      }
    );

    if (!isPendingGrant(grant)) {
      return NextResponse.json(
        { message: "Expected interactive grant" },
        { status: 500 }
      );
    }

    const grantId = crypto.randomUUID();

    // Store the grant locally (legacy)
    addGrant({
      id: grantId,
      wagerId,
      participantId: player,
      walletUrl,
      amount: parseInt(amount),
      continueToken: grant.continue.access_token.value,
      continueUri: grant.continue.uri,
      status: "pending",
    });

    // --- CRITICAL: Persist to Firebase so it survives server restarts ---
    const firebaseGrant = {
      id: grantId,
      wagerId,
      participantId: player,
      walletUrl,
      amount: parseInt(amount),
      continueToken: grant.continue.access_token.value,
      continueUri: grant.continue.uri,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    await adminDb.ref(`grants/${grantId}`).set(firebaseGrant);

    return NextResponse.json({
      grantUrl: grant.interact.redirect,
      continueToken: grant.continue.access_token.value,
      continueUri: grant.continue.uri,
      wagerId,
      grantId,
    });
  } catch (err) {
    console.error("[ilp/grant] error:", err);
    return NextResponse.json(
      { message: "Failed to request grant", error: String(err) },
      { status: 500 }
    );
  }
}
