import { Router, type Request, type Response } from "express";
import { isPendingGrant } from "@interledger/open-payments";
import { getOpenPaymentsClient, generateNonce, WALLET_ADDRESS } from "../lib/openPaymentsClient";
import { rtdb } from "../lib/firebaseAdmin";

const router = Router();

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

// ─── Step 1: Request outgoing payment grant + quote grant ─────────────────────
// GET /api/transaction
router.get("/", async (req: Request, res: Response) => {
  const { uid, senderwalletid, walletid, amount } = req.query as Record<string, string>;

  if (!uid || !senderwalletid || !walletid || !amount) {
    return res.status(400).json({ message: "Missing required query params" });
  }

  try {
    const client = await getOpenPaymentsClient();
    const NONCE = generateNonce();

    // Parse standard Open Payments payment pointers (e.g., $ilp.interledger-test.dev/james)
    const senderUrl = senderwalletid.startsWith("$")
      ? senderwalletid.replace("$", "https://")
      : senderwalletid.startsWith("http")
        ? senderwalletid
        : `https://ilp.interledger-test.dev/${senderwalletid}`;

    const senderWallet = await client.walletAddress.get({
      url: senderUrl,
    });

    // Outgoing payment grant and Quote grant bundled into one interactive request
    const grant = await client.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [
            {
              identifier: senderWallet.id,
              type: "outgoing-payment",
              actions: ["list", "list-all", "read", "read-all", "create"],
              limits: {
                debitAmount: {
                  assetCode: "SGD",
                  assetScale: 2,
                  value: amount,
                },
              },
            },
            {
              type: "quote",
              actions: ["create", "read"]
            }
          ],
        },
        interact: {
          start: ["redirect"],
          finish: {
            method: "redirect",
            uri: `${BASE_URL}/wager`,
            nonce: NONCE,
          },
        },
      }
    );

    if (!isPendingGrant(grant)) {
      return res.status(500).json({ message: "Expected interactive grant" });
    }

    // Persist unified token
    await rtdb.ref(`users/${uid}`).update({
      "ilp/quotegrant": grant.continue.access_token.value,
      "ilp/outgoinggrant": grant.continue.access_token.value,
      "ilp/outgoinggranturl": grant.continue.uri,
    });

    return res.json({
      grantUrl: grant.interact.redirect,
      continueToken: grant.continue.access_token.value,
      continueUri: grant.continue.uri,
    });
  } catch (err) {
    console.error("[transaction] grant request error:", err);
    return res.status(500).json({ message: "Failed to request grant" });
  }
});

// POST /api/transaction/interact
// Stores the interact_ref after the user redirects back from the ILP auth
router.post("/interact", async (req: Request, res: Response) => {
  const { uid, interact_ref, hash } = req.body;
  if (!uid || !interact_ref) {
    return res.status(400).json({ message: "Missing uid or interact_ref" });
  }

  try {
    await rtdb.ref(`users/${uid}/ilp`).update({
      interactref: interact_ref,
      hash: hash || "",
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("[transaction/interact] error:", err);
    return res.status(500).json({ message: "Failed to store interact ref" });
  }
});

// ─── Step 2: Incoming payment grant + create incoming payment ─────────────────
// GET /api/transaction/incominggrant
router.get("/incominggrant", async (req: Request, res: Response) => {
  const { uid, walletid, amount, senderwallet } = req.query as Record<string, string>;

  if (!uid || !walletid || !amount) {
    return res.status(400).json({ message: "Missing required params" });
  }

  try {
    const client = await getOpenPaymentsClient();

    const receiverWallet = await client.walletAddress.get({ url: walletid });

    const grant = await client.grant.request(
      { url: receiverWallet.authServer },
      {
        access_token: {
          access: [
            {
              type: "incoming-payment",
              actions: ["list", "read", "read-all", "complete", "create"],
            },
          ],
        },
      }
    );

    if (isPendingGrant(grant)) {
      return res.status(500).json({ message: "Expected non-interactive grant" });
    }

    await rtdb.ref(`users/${uid}`).update({
      "ilp/incomingtoken": grant.access_token.value,
    });

    // Chain to incoming transfer
    const baseUrl = process.env.BASE_URL ?? "http://localhost:3001";
    fetch(
      `${baseUrl}/api/transaction/incomingtransfer?uid=${uid}&amount=${amount}&walletid=${walletid}&senderwallet=${senderwallet}`
    ).catch((e) => console.error("[incominggrant] chain error:", e));

    return res.json({
      continueToken: grant.access_token.value,
      url: grant.access_token.manage,
    });
  } catch (err) {
    console.error("[transaction/incominggrant] error:", err);
    return res.status(500).json({ message: "Failed incoming grant" });
  }
});

// GET /api/transaction/finaltransfer
// In P2P architecture, this endpoint takes the Claimant's wallet ID as `walletid`
// and executes the stream directly from the Funder's pending `outgoinggrant`.
router.get("/finaltransfer", async (req: Request, res: Response) => {
  const { uid, walletid, senderwallet } = req.query as Record<string, string>;

  if (!uid || !walletid || !senderwallet) {
    return res.status(400).json({ message: "Missing required params" });
  }

  try {
    const client = await getOpenPaymentsClient();
    const userSnap = await rtdb.ref(`users/${uid}`).get();
    const ilp = userSnap.val()?.ilp ?? {};

    const { outgoinggranturl, outgoinggrant, interactref, quoteurl } = ilp;
    let { finalpaymentgrant } = ilp;

    const receiverWallet = await client.walletAddress.get({ url: walletid });
    const senderWallet = await client.walletAddress.get({ url: senderwallet });

    if (!finalpaymentgrant) {
      const finalizedGrant = await client.grant.continue(
        { url: outgoinggranturl, accessToken: outgoinggrant },
        { interact_ref: interactref }
      );
      finalpaymentgrant = (finalizedGrant as { access_token: { value: string } }).access_token.value;
      await rtdb.ref(`users/${uid}`).update({
        "ilp/finalpaymentgrant": finalpaymentgrant,
      });
    }

    await client.outgoingPayment.create(
      { url: senderWallet.resourceServer, accessToken: finalpaymentgrant },
      { walletAddress: senderWallet.id, quoteId: quoteurl }
    );

    return res.json({ statement: true });
  } catch (err) {
    console.error("[transaction/finaltransfer] error:", err);
    return res.status(500).json({ message: "Failed to finalize transfer" });
  }
});

export default router;
