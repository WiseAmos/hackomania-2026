import { getOpenPaymentsClient, generateNonce } from "../lib/openPayments";

const senderWallet = "https://ilp.interledger-test.dev/pranav";
const receiverWallet = "https://ilp.interledger-test.dev/receiver"; // Or whatever
const amount = "100";

async function run() {
    const client = await getOpenPaymentsClient();
    const sender = await client.walletAddress.get({ url: senderWallet });
    console.log("Sender:", sender.id, sender.assetCode, sender.assetScale);

    const receiver = await client.walletAddress.get({ url: receiverWallet });
    console.log("Receiver:", receiver.id, receiver.assetCode, receiver.assetScale);

    console.log("If we request an incoming payment for", amount);
    const incomingGrant = await client.grant.request(
        { url: receiver.authServer },
        {
            access_token: {
                access: [{ type: "incoming-payment", actions: ["create", "read", "complete"] }],
            },
        }
    );
    const incomingAccessToken = (incomingGrant as any).access_token?.value;

    console.log("Creating incoming payment...");
    const incomingPayment = await client.incomingPayment.create(
        { url: receiver.resourceServer, accessToken: incomingAccessToken },
        {
            walletAddress: receiver.id,
            incomingAmount: { value: amount.toString(), assetCode: receiver.assetCode, assetScale: receiver.assetScale },
        }
    );
    console.log("Incoming payment created:", incomingPayment.id);

    console.log("Now we need a quote to fund it. To get a quote we need a temporary testing accessToken (without interactive grant, just to see what the quote expects)");

    // We can't generate a quote without an access token for the sender's outgoing-payment
    // Usually an outgoing-payment read/create grant requires interactive auth.
    // I will just catch the error or we can see if quote requires interactive auth? 
}
run().catch(console.error);
