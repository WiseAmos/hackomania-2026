import { createAuthenticatedClient } from "@interledger/open-payments";
import crypto from "crypto";

const WALLET_ADDRESS =
  process.env.ILP_WALLET_ADDRESS ?? "https://ilp.interledger-test.dev/emergetrust";

const KEY_ID = process.env.ILP_KEY_ID ?? "";

const PRIVATE_KEY_B64 = process.env.ILP_PRIVATE_KEY_B64 ?? "";

function getPrivateKey(): Buffer {
  if (!PRIVATE_KEY_B64) {
    throw new Error("ILP_PRIVATE_KEY_B64 environment variable is not set");
  }
  return Buffer.from(PRIVATE_KEY_B64, "base64");
}

export async function getOpenPaymentsClient() {
  return createAuthenticatedClient({
    walletAddressUrl: WALLET_ADDRESS,
    privateKey: getPrivateKey(),
    keyId: KEY_ID,
    validateResponses: false,
  });
}

export function generateNonce(): string {
  return crypto.randomUUID();
}

export { WALLET_ADDRESS };
