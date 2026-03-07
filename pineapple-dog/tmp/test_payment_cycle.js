const { adminDb } = require("./lib/firebaseAdmin");
const { getOpenPaymentsClient, normalizeWalletUrl } = require("./lib/openPayments");

async function testPaymentCycle() {
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
    console.log(`Amount: ${targetGrant.amount} cents`);

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
        console.log(JSON.stringify(payment, null, 2));

        // Update grant status in DB if needed (optional for test)
        // await adminDb.ref(`grants/${targetGrant.id}`).update({ status: "executed" });

    } catch (err) {
        console.error("Payment failed:", err);
        if (err.response) {
            console.error("Response data:", JSON.stringify(err.response.data, null, 2));
        }
    }

    process.exit(0);
}

testPaymentCycle();
