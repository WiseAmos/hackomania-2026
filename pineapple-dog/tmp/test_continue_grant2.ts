import { getOpenPaymentsClient } from "../lib/openPayments";

const CONTINUE_TOKEN = "4DD2F288FB464A6FE994";
const CONTINUE_URL = "https://auth.interledger-test.dev/continue/ccd49184-bf03-4da5-9562-cace6c46e25f";
const INTERACT_REF = "ce0afd7a-349e-4930-a921-71ffc06fe5a7";

async function main() {
    try {
        const client = await getOpenPaymentsClient();
        const res = await client.grant.continue(
            { accessToken: CONTINUE_TOKEN, url: CONTINUE_URL },
            { interact_ref: INTERACT_REF }
        );
        console.log("Success:", JSON.stringify(res, null, 2));
    } catch (err: any) {
        console.log("CATCH BLOCK EXEC: ", Object.keys(err));
        console.log("err.message:", err.message);
        if (err.name) console.log("err.name:", err.name);
        if (err.code) console.log("err.code:", err.code);
        if (err.response) {
            console.log("err.response.status:", err.response.status);
            console.log("err.response.data:", err.response.data);
        }
    }
}
main();
