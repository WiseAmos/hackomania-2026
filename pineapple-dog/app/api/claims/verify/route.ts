import { NextRequest, NextResponse } from "next/server";
import { PDLEngine, ClaimManifest } from "@/lib/pdl-engine";

export async function POST(req: NextRequest) {
  try {
    const manifest: ClaimManifest = await req.json();

    if (!manifest.claim_id || !manifest.selected_category) {
      return NextResponse.json(
        { error: "Invalid claim manifest. Missing claim_id or selected_category." },
        { status: 400 }
      );
    }

    const engine = new PDLEngine();
    const result = await engine.processClaim(manifest);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error processing claim:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
