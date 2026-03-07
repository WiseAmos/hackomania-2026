import fs from 'fs';
import path from 'path';

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=').trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            process.env[key.trim()] = value;
        }
    });
}

async function testPaymentCycle() {
    // Dynamic imports to ensure process.env is set first
    const { adminDb } = await import("../lib/firebaseAdmin");
    const { getOpenPaymentsClient, normalizeWalletUrl } = await import("../lib/openPayments");

    console.log("Searching for authorized grants...");
    const snap = await adminDb.ref("grants").once("value");
    const grants = snap.val() || {};

    let targetGrant = null;
    for (const id in grants) {
        if (grants[id].status === "authorized") {
            targetGrant = grants[id];
            break;
        }
    }

    if (!targetGrant) {
        console.error("No authorized grants found. Please create a wager and authorize the stake hold first.");
        process.exit(1);
    }

    console.log(`Found authorized grant: ${targetGrant.id} from ${targetGrant.walletUrl}`);
    console.log(`Original amount: ${targetGrant.amount} cents`);

    const client = await getOpenPaymentsClient();
    const receiverWalletUrl = normalizeWalletUrl("$ilp.interledger-test.dev/james");
    const transferAmount = 500; // $5 = 500 cents

    try {
        console.log(`Creating quote for ${transferAmount} cents to ${receiverWalletUrl}...`);

        const receiverWallet = await client.walletAddress.get({ url: receiverWalletUrl });
        const senderWallet = await client.walletAddress.get({ url: normalizeWalletUrl(targetGrant.walletUrl) });

        const quote = await client.quote.create(
            { url: senderWallet.resourceServer, accessToken: targetGrant.continueToken },
            {
                walletAddress: senderWallet.id,
                receiver: receiverWallet.id,
                method: "ilp",
                debitAmount: { assetCode: "SGD", assetScale: 2, value: transferAmount.toString() },
            }
        );

        console.log(`Quote created: ${quote.id}`);
        console.log(`Executing outgoing payment...`);

        const payment = await client.outgoingPayment.create(
            { url: senderWallet.resourceServer, accessToken: targetGrant.continueToken },
            { walletAddress: senderWallet.id, quoteId: quote.id }
        );

        console.log("Payment successful!");
        console.log("Payment Details:", JSON.stringify(payment, null, 2));

    } catch (err: any) {
        console.error("Payment failed:", err.message);
        if (err.description) console.error("Description:", err.description);
        if (err.status) console.error("Status Code:", err.status);
    }

    process.exit(0);
}

testPaymentCycle().catch(err => {
    console.error("Script error:", err);
    process.exit(1);
});
