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
            if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
            process.env[key.trim()] = value;
        }
    });
}

async function listWagers() {
    const { adminDb } = await import("../lib/firebaseAdmin");
    const snap = await adminDb.ref("wagers").once("value");
    const wagers = snap.val() || {};
    console.log("WAGERS LIST:");
    console.log(JSON.stringify(wagers, null, 2));
    process.exit(0);
}

listWagers();
