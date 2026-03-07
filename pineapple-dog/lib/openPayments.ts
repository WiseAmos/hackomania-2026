import { createAuthenticatedClient } from "@interledger/open-payments";
import crypto from "crypto";

export const WALLET_ADDRESS = "https://ilp.interledger-test.dev/james";

const KEY_ID = "a25121d8-b1ef-4a81-8f75-2ee25d62dc64";

const RAW_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEINvds4N1QhzkdAcHrBZhKpkQAHX0ltTsxn3qYTxVBtXz
-----END PRIVATE KEY-----`;

export async function getOpenPaymentsClient() {
  return createAuthenticatedClient({
    walletAddressUrl: WALLET_ADDRESS,
    privateKey: Buffer.from(RAW_PRIVATE_KEY),
    keyId: KEY_ID,
    validateResponses: false,
  });
}

export function generateNonce(): string {
  return crypto.randomUUID();
}

/**
 * Normalizes wallet address input into a full URL.
 * Supports: $ilp.interledger-test.dev/name, https://..., or just "name"
 */
export function normalizeWalletUrl(input: string): string {
  if (!input || !input.trim()) return ""; // Guard: never build a URL from empty string
  const trimmed = input.trim();
  if (trimmed.startsWith("$")) return trimmed.replace("$", "https://");
  if (trimmed.startsWith("http")) return trimmed;
  return `https://ilp.interledger-test.dev/${trimmed}`;
}
