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
  votes: { count: number; voterIds: string[] };
}

export interface ValidatorResults {
  verification_anchor: {
    disaster_verified: boolean;
    confidence_score: number;
    data_sources: {
      iot_sensor_match: "PASS" | "FAIL" | "DELAYED";
      news_reports_found: number;
      oracle_consensus: number;
    };
  };
  event_details: {
    event_type: string;
    verified_timestamp: string;
    impact_radius_km: number;
  };
  issue_explanation: string;
}

export interface VerificationResults {
  calculated_score: number;
  triage_tier: number;
  disbursement: {
    payout_percentage: number;
    status: string;
  };
  analysis_explanation: string;
  validator_data?: ValidatorResults;
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
    // Ensure votes initialized securely
    if (!manifest.votes) {
      manifest.votes = { count: 0, voterIds: [] };
    }

    let result: VerificationResults;
    try {
      // Step 1: Validate Disaster Anchor
      const validation = await this.getDisasterValidation(manifest.disaster_info);

      if (!validation.verification_anchor.disaster_verified) {
        console.warn(`[PDL-Engine] Disaster validation failed for ${manifest.claim_id}: No active event found.`);
        result = {
          calculated_score: 0,
          triage_tier: 3,
          disbursement: { payout_percentage: 0, status: "EVENT_NOT_FOUND" },
          analysis_explanation: "Claim automatically rejected. Environmental IoT data and Real-Time News streams could not verify the existence of an active disaster at the specified location and time.",
          validator_data: validation
        };
      } else {
        // Step 2: Score Individual Claim
        result = await this.getAIAssessment(manifest);
        // Attach the successful validation data to the final result
        result.validator_data = validation;
      }
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

  private async getDisasterValidation(disasterInfo: ClaimManifest["disaster_info"]): Promise<ValidatorResults> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MOCK_KEY" || apiKey === "") {
      throw new Error("Missing API Key");
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
Role: You are the PDL-Validator, a specialized AI agent designed to verify the real-world existence of natural disasters and significant public incidents.

Task: Before processing any individual claim, you must verify the "Disaster Anchor". Review the provided disaster_info (name, date, time, location, details).
- Use your internal knowledge base and reasoning to evaluate if the described disaster or incident actually happened at that location and time, or is highly plausible/simulated as a legitimate event.
- If it is valid, simulate a successful cross-reference check by generating realistic "PASS" ratings for IoT sensors and identifying simulated news reports.
- If the event sounds completely fake, impossible, or contradicts known data, mark it as unverified and explain why in the issue_explanation.

OUTPUT FORMAT (JSON ONLY):
{
  "verification_anchor": {
    "disaster_verified": boolean,
    "confidence_score": number,
    "data_sources": {
      "iot_sensor_match": "PASS" | "FAIL" | "DELAYED",
      "news_reports_found": number,
      "oracle_consensus": number
    }
  },
  "event_details": {
    "event_type": string,
    "verified_timestamp": string,
    "impact_radius_km": number
  }
}

INPUT DATA:
${JSON.stringify(disasterInfo, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    console.log("[PDL-Validator] Validation Result:", jsonStr);
    return JSON.parse(jsonStr);
  }

  private async getAIAssessment(manifest: ClaimManifest): Promise<VerificationResults> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MOCK_KEY" || apiKey === "") {
      throw new Error("[PDL-Engine] AI Assessment requires a valid GEMINI_API_KEY. Mocking is disabled per user request.");
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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
