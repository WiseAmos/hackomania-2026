import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const grantsSnap = await adminDb.ref("pool/grants").once("value");
    const data: any[] = [];
    grantsSnap.forEach(child => {
      data.push({ id: child.key, ...child.val() });
    });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
