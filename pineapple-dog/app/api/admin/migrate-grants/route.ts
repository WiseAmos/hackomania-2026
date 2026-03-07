import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";

/**
 * POST /api/admin/migrate-grants
 *
 * One-time migration: for any wager that has a top-level grantId
 * but the first participant is missing their grantId, copy it down.
 * Safe to run multiple times (idempotent).
 */
export async function POST(req: NextRequest) {
  try {
    const snap = await adminDb.ref("wagers").once("value");
    const data = snap.val();

    if (!data) {
      return NextResponse.json({ message: "No wagers found", migrated: 0 });
    }

    let migrated = 0;
    let skipped = 0;

    for (const [wagerId, wager] of Object.entries(data as Record<string, any>)) {
      const topLevelGrantId: string = wager.grantId || "";
      const participants: any[] = Array.isArray(wager.participants) ? wager.participants : [];

      // Log the state of each wager for debugging
      console.log(`[migrate] Wager ${wagerId}: topLevelGrantId="${topLevelGrantId}", participants=${participants.length}`,
        participants.map((p: any) => `${p.uid}->grantId:"${p.grantId}"`));

      if (!topLevelGrantId) {
        skipped++;
        continue;
      }

      // Find any participant missing a real grantId (undefined, null, or empty string)
      let updated = false;
      const updatedParticipants = participants.map((p: any, i: number) => {
        const hasGrant = p.grantId && p.grantId.length > 0;
        if (!hasGrant) {
          console.log(`[migrate] Wager ${wagerId}: setting participant[${i}] (${p.uid}) grantId = ${topLevelGrantId}`);
          updated = true;
          return { ...p, grantId: topLevelGrantId };
        }
        return p;
      });

      if (updated) {
        await adminDb.ref(`wagers/${wagerId}`).update({
          participants: updatedParticipants,
        });
        migrated++;
        console.log(`[migrate] ✅ Wager ${wagerId} migrated`);
      } else {
        skipped++;
        console.log(`[migrate] ⏭ Wager ${wagerId} skipped — participants already have grantIds`);
      }
    }

    return NextResponse.json({
      success: true,
      migrated,
      skipped,
      message: `Migrated ${migrated} wager(s). ${skipped} already had per-player grantIds.`,
    });
  } catch (err) {
    console.error("[migrate-grants] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
