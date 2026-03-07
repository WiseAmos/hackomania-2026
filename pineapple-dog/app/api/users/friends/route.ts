import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const uid = req.nextUrl.searchParams.get("uid");
    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const friendsRef = adminDb.ref(`users/${uid}/friends`);
    const snapshot = await friendsRef.once("value");

    const friends = snapshot.val() || {};
    return NextResponse.json(friends);
  } catch (err) {
    console.error("[api/friends GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, friendUid, isAdding } = body;

    if (!uid || !friendUid) {
      return NextResponse.json({ error: "Missing uid or friendUid" }, { status: 400 });
    }

    const friendsRef = adminDb.ref(`users/${uid}/friends/${friendUid}`);

    if (isAdding) {
      await friendsRef.set(true);
    } else {
      await friendsRef.remove();
    }

    return NextResponse.json({ success: true, isAdding });
  } catch (err) {
    console.error("[api/friends POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
