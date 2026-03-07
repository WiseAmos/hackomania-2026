import { createAuthenticatedClient } from "@interledger/open-payments";
import crypto from "crypto";

const WALLET_ADDRESS = "https://ilp.interledger-test.dev/james";

// The Key ID acts as the identifier for the public key uploaded to the wallet
const KEY_ID = "1bb7ccfe-dc0b-4696-8c1e-a4fabcb7f9e7";

// Using the explicit raw private key provided by the user
const RAW_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIPG5+Z80zh0FMZPrfwZabNxz/Mwy+Cb9KMBz2BWWpjAz
-----END PRIVATE KEY-----`;

function getPrivateKey(): Buffer {
  return Buffer.from(RAW_PRIVATE_KEY);
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
