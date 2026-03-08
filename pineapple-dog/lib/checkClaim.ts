
import fs from "fs";
import path from "path";

// Manually load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8");
    env.split("\n").forEach(line => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
            const value = valueParts.join("=").trim().replace(/^"(.*)"$/, "$1").replace(/\\n/g, "\n");
            process.env[key.trim()] = value;
        }
    });
}

async function run() {
    const { adminDb } = await import("./firebaseAdmin");
    const claimId = process.argv[2];
    if (!claimId) process.exit(1);
    
    const snap = await adminDb.ref(`claims/${claimId}`).once("value");
    const claim = snap.val();
    if (claim) {
        console.log("KEYS:", Object.keys(claim).join(", "));
        console.log("claimantWallet TYPE:", typeof claim.claimantWallet);
        console.log("claimantWallet VALUE:", claim.claimantWallet);
    } else {
        console.log("NOT FOUND");
    }
    process.exit(0);
}

run();
