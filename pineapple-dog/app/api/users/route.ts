import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

export async function GET() {
    try {
        const usersRef = adminDb.ref("users");
        const snapshot = await usersRef.once("value");

        const users: any[] = [];
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            // Ensure we don't expose sensitive info if added later, but grab what's needed for UI
            users.push({
                uid: childSnapshot.key,
                name: userData.name || "Unknown",
                avatar: userData.avatar || "?",
                handle: userData.handle || "",
                walletAddress: userData.walletAddress || "",
            });
        });

        return NextResponse.json(users);
    } catch (err) {
        console.error("[api/users GET]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
