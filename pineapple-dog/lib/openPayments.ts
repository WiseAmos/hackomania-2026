import { createAuthenticatedClient } from "@interledger/open-payments";
import crypto from "crypto";

export const WALLET_ADDRESS = "https://ilp.interledger-test.dev/james";

const KEY_ID = "1bb7ccfe-dc0b-4696-8c1e-a4fabcb7f9e7";

const RAW_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIPG5+Z80zh0FMZPrfwZabNxz/Mwy+Cb9KMBz2BWWpjAz
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
