import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

/**
 * GET /api/proofs?wagerId=xxx  — list proof posts (optionally by wager)
 * POST /api/proofs              — submit a new proof of progress
 */
export async function GET(req: NextRequest) {
  try {
    const wagerId = req.nextUrl.searchParams.get("wagerId");
    const proofsRef = adminDb.ref("proofs");

    let snap;
    if (wagerId) {
      snap = await proofsRef.orderByChild("wagerId").equalTo(wagerId).once("value");
    } else {
      snap = await proofsRef.orderByChild("createdAt").limitToLast(50).once("value");
    }

    const data: Record<string, unknown>[] = [];
    snap.forEach((child) => {
      data.push({ id: child.key, ...child.val() });
    });

    return NextResponse.json(data.reverse());
  } catch (err) {
    console.error("[api/proofs GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, userAvatar, userHandle, wagerId, wagerTitle, photoUrl, caption } = body;

    if (!userId || !wagerId || !caption) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const proofData = {
      user: {
        id: userId,
        name: userName || "Anonymous",
        avatar: userAvatar || "?",
        handle: userHandle || "",
      },
      wager: {
        id: wagerId,
        title: wagerTitle || "Untitled",
      },
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
      caption,
      timestamp: new Date().toISOString(),
      verifications: 0,
      rejections: 0,
      createdAt: new Date().toISOString(),
    };

    const ref = adminDb.ref("proofs").push();
    await ref.set(proofData);

    // --- Winning Logic ---
    const wagerRef = adminDb.ref(`wagers/${wagerId}`);
    const wagerSnap = await wagerRef.once("value");
    if (wagerSnap.exists()) {
      const wager = wagerSnap.val();
      console.log(`>>> [PROOFS] Checking wager ${wagerId} for winner. Type: ${wager.type}, isStreak: ${wager.isStreak}, currentWinner: ${wager.winner}`);

      // If it's a competitive/global challenge, NOT a streak, and NO winner exists yet
      if (!wager.isStreak && (wager.type === 'global' || wager.type === 'competitive') && !wager.winner) {
        console.log(`>>> [PROOFS] WINNER DETECTED: ${userId}. Resolving wager...`);

        // 1. Update Wager State in DB
        await wagerRef.update({
          winner: userId,
          status: 'resolved',
          resolvedAt: new Date().toISOString()
        });

        // 2. Update participant status for everyone
        const participants = wager.participants || [];
        const updatedParticipants = participants.map((p: any) => {
          if (p.uid === userId) {
            return { ...p, status: 'winner' };
          }
          return { ...p, status: 'eliminated' };
        });
        await wagerRef.update({ participants: updatedParticipants });
        console.log(">>> [PROOFS] Wager updated as resolved. Triggering ILP settle...");

        // 3. Trigger Interledger Settlement
        const url = new URL(req.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        console.log(`>>> [PROOFS] Dispatching settlement to: ${baseUrl}/api/ilp/resolve`);

        try {
          const res = await fetch(`${baseUrl}/api/ilp/resolve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wagerId, winnerId: userId }),
          });
          const resJson = await res.json();
          console.log(`>>> [PROOFS] Settlement DISPATCH SUCCESS (${res.status}):`, resJson);
        } catch (err) {
          console.error(">>> [PROOFS] Settlement DISPATCH FATAL ERROR:", err);
        }
      } else {
        console.log(">>> [PROOFS] No resolution needed (Match ongoing or already resolved)");
      }
    }

    return NextResponse.json({ id: ref.key, ...proofData });
  } catch (err) {
    console.error("[api/proofs POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
