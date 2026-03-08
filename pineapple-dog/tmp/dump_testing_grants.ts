import { adminDb } from "../lib/firebaseAdmin";

async function dumpTestingGrants() {
    const snap = await adminDb.ref("testing_grants").once("value");
    console.log(JSON.stringify(snap.val(), null, 2));
    process.exit(0);
}

dumpTestingGrants();
