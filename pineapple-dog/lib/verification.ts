export interface ClaimManifest {
  claim_id: string;
  submission_date: string;
  disaster_info: {
    name: string;
    date: string;
    time?: string;
    details: string;
    location?: string;
  };
  title: string;
  description: string;
  amount_requested: number;
  selected_category: string;
  category_details: {
    property?: {
      home_address: string;
      registry_match: boolean;
      satellite_damage_img: string;
    };
    presence?: {
      gps_location_logs: { lat: number; lng: number }[];
      telecom_tower_data: string;
      geotagged_media: string;
    };
    livelihood?: {
      business_uen: string;
      sector: string;
      income_loss_proof: string;
    };
  };
}

export interface VerificationResults {
  calculated_score: number;
  triage_tier: number;
  disbursement: {
    payout_percentage: number;
    status: string;
  };
  analysis_explanation: string;
}

export interface UnifiedResponse {
  claim_manifest: ClaimManifest;
  verification_results: VerificationResults;
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "./firebaseAdmin";

export class PDLEngine {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "MOCK_KEY";
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Processes a claim manifest and returns the unified response.
   */
  public async processClaim(manifest: ClaimManifest): Promise<UnifiedResponse> {
    let result;
    try {
      result = await this.getAIAssessment(manifest);
    } catch (e) {
      console.warn("AI Assessment failing, falling back to basic logic:", e);
      result = this.basicScoreFallback();
    }

    const response: UnifiedResponse = {
      claim_manifest: manifest,
      verification_results: result,
    };

    // Persist to Database
    try {
      await this.saveTokenToDb(response);
    } catch (e) {
      console.error("Failed to save claim to database:", e);
    }

    return response;
  }

  private async saveTokenToDb(response: UnifiedResponse) {
    const claimId = response.claim_manifest.claim_id;
    const claimRef = adminDb.ref(`claims/${claimId}`);
    await claimRef.update({
      ...response,
      updated_at: new Date().toISOString()
    });
    console.log(`[PDL-Engine] Claim ${claimId} verified and updated in database.`);
  }

  private basicScoreFallback(): VerificationResults {
    // Simple fallback if AI is down
    return {
      calculated_score: 0,
      triage_tier: 3,
      disbursement: {
        payout_percentage: 0,
        status: "PENDING_HUMAN_REVIEW"
      },
      analysis_explanation: "AI assessment failed. Falling back to manual review."
    };
  }

  private async getAIAssessment(manifest: ClaimManifest): Promise<VerificationResults> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MOCK_KEY" || apiKey === "") {
      throw new Error("[PDL-Engine] AI Assessment requires a valid GEMINI_API_KEY. Mocking is disabled per user request.");
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    const prompt = `
Role: You are the PDL-Engine, a high-precision risk-assessment auditor for disaster relief claims. 

Objective: Evaluate the following disaster claim manifest and provide a **NUANCED, GRADED scoring assessment**. 

---
SCORING GUIDELINES (Total Max 100):
You must evaluate each section on a scale from 0 to its maximum value based on the evidence provided. Do NOT use binary (all-or-nothing) scores unless the evidence is absolute.

1. Disaster Confirmation (Max 40):
   - Score based on how well the disaster_info (name, date, time, details, location) matches known historical or real-time event patterns.
   - High scores for specific, consistent details that align with the provided disaster type.
   - Graded based on timing and description accuracy.

2. Identity & Account Standing (Max 20):
   - Score based on the completeness of the claim metadata (claim_id, title, description, submission_date).
   - Higher scores for professional, consistent data.

3. Location/Sector Match (Max 40):
   - Graded based on the proximity of user's signals (home_address, gps_location_logs, or business_uen) to the disaster zone.
   - 40 pts: Direct hit / exact location.
   - 20-35 pts: Near impact zone / same city district.
   - 5-19 pts: Regional proximity but not directly in the damage zone.

---
TRIAGE TIERS:
- Tier 1 (Score ≥ 70): Confirmed. 100% Payout. Status: DISBURSED.
- Tier 2 (Score 50-69): Probable. 20% Payout. Status: PARTIAL_DISBURSED.
- Tier 3 (Score < 50): Low Confidence. 0% Payout. Status: PENDING_HUMAN_REVIEW.

---
OUTPUT FORMAT (JSON ONLY):
{
  "calculated_score": number, 
  "triage_tier": number,
  "disbursement": {
    "payout_percentage": number,
    "status": "DISBURSED" | "PARTIAL_DISBURSED" | "PENDING_HUMAN_REVIEW"
  },
  "analysis_explanation": "A detailed 2-3 sentence explanation of why this score was given, citing specific evidence from the manifest."
}

INPUT DATA:
${JSON.stringify(manifest, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    console.log("[PDL-Engine] AI Assessment Result:", jsonStr);
    return JSON.parse(jsonStr);
  }
}
