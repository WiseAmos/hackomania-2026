import { getOpenPaymentsClient } from "../lib/openPayments";

const CONTINUE_TOKEN = "4DD2F288FB464A6FE994";
const CONTINUE_URL = "https://auth.interledger-test.dev/continue/ccd49184-bf03-4da5-9562-cace6c46e25f";

// ⚠️ IMPORTANT: You must replace this with the actual interact_ref 
// string that you received from the redirect URI after the user authorized the grant!
// If this is missing or incorrect, the request will fail.
const INTERACT_REF = "ce0afd7a-349e-4930-a921-71ffc06fe5a7";

async function main() {
    try {
        const client = await getOpenPaymentsClient();

        console.log("Calling client.grant.continue() with:");
        console.log(" - Token:", CONTINUE_TOKEN);
        console.log(" - URL:", CONTINUE_URL);
        console.log(" - interact_ref:", INTERACT_REF);
        console.log("\nWaiting for response from Interledger...\n");

        const userOutgoingPaymentGrant = await client.grant.continue(
            {
                accessToken: CONTINUE_TOKEN,
                url: CONTINUE_URL,
            },
            {
                interact_ref: INTERACT_REF,
            },
        );

        console.log("✅ Success! Returned Grant Data:");
        console.log(JSON.stringify(userOutgoingPaymentGrant, null, 2));

    } catch (error: any) {
        console.error("❌ Error continuing grant:");
        if (error.response && error.response.data) {
            console.error("API Response Error:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message || error);
        }
    }
}

main();
