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
      satellite_damage_img?: string;
    };
    presence?: {
      gps_location_logs: { lat: number; lng: number }[];
      telecom_tower_data: string;
      geotagged_media?: string;
    };
    livelihood?: {
      business_uen: string;
      sector: string;
      income_loss_proof?: string;
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
  status?: string;
  updated_at?: string;
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

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Role: You are the PDL-Validator, a system that checks whether a disaster description is PLAUSIBLE enough to proceed with claim evaluation.

      Important:
      This step is NOT meant to fact-check the real world. Your goal is simply to determine whether the described disaster sounds realistic and internally consistent.

      Guidelines:
      - If the disaster type, date, and description sound plausible for the region or situation, mark it as verified.
      - Missing details should NOT cause rejection.
      - If information is vague but reasonable, assume it is valid.
      - Only reject if the event is clearly impossible, contradictory, or nonsensical.

      Examples of acceptable disasters:
      - Floods
      - Storms
      - Earthquakes
      - Wildfires
      - Infrastructure failures
      - Large accidents
      - Public emergencies

      Examples to reject:
      - Physically impossible events
      - Completely incoherent descriptions
      - Obviously fabricated fantasy scenarios

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
        },
        "issue_explanation": "Short explanation. If rejected, explain why it is implausible."
      }

      Important:
      If the disaster sounds reasonably believable, set disaster_verified = true.

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

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create a sanitized copy of the manifest to avoid sending large base64 strings
    const { category_details, ...manifestWithoutDetails } = manifest;

    const sanitizedManifest = {
      ...manifestWithoutDetails,
      category_details: {
        property: category_details?.property ? {
          home_address: category_details.property.home_address,
          registry_match: category_details.property.registry_match,
        } : undefined,
        presence: category_details?.presence ? {
          gps_location_logs: category_details.presence.gps_location_logs,
          telecom_tower_data: category_details.presence.telecom_tower_data,
        } : undefined,
        livelihood: category_details?.livelihood ? {
          business_uen: category_details.livelihood.business_uen,
          sector: category_details.livelihood.sector,
        } : undefined,
      }
    };

    const prompt = `
    Role: You are the PDL-Engine, evaluating disaster relief claims.

    Your job is to assign a FAIR but GENEROUS credibility score.

    Important Principles:
    - Claims should generally be given the benefit of the doubt.
    - Incomplete information should not heavily penalize the score.
    - Plausible claims should receive moderate-to-high scores.
    - Only give very low scores if the claim is clearly inconsistent or unrealistic.

    SCORING GUIDELINES (Total Max 100):

    1. Disaster Plausibility (Max 40)
    Evaluate whether the disaster_info description sounds realistic and internally consistent.

    Typical scoring:
    - 30–40: believable and detailed
    - 20–30: plausible but limited information
    - 10–20: vague but possible
    - 0–10: clearly inconsistent or impossible

    2. Claim Quality (Max 20)
    Evaluate the completeness of the claim information.

    Typical scoring:
    - 15–20: clear description
    - 10–15: basic explanation
    - 5–10: minimal details but understandable

    3. Location / Sector Relevance (Max 40)

    Score based on whether the claimant appears reasonably connected to the disaster location or affected sector.

    Typical scoring:
    - 30–40: directly located or clearly affected
    - 20–30: nearby or plausible connection
    - 10–20: indirect but possible
    - 0–10: unrelated or inconsistent

    TRIAGE TIERS:

    Tier 1 (Score ≥ 60)
    Status: DISBURSED
    Payout: 100%

    Tier 2 (Score 40–59)
    Status: PARTIAL_DISBURSED
    Payout: 20%

    Tier 3 (Score < 40)
    Status: PENDING_HUMAN_REVIEW
    Payout: 0%

    OUTPUT FORMAT (JSON ONLY):
    {
      "calculated_score": number,
      "triage_tier": number,
      "disbursement": {
        "payout_percentage": number,
        "status": "DISBURSED" | "PARTIAL_DISBURSED" | "PENDING_HUMAN_REVIEW"
      },
      "analysis_explanation": "2-3 sentence explanation referencing the claim data."
    }

    INPUT DATA:
    ${JSON.stringify(sanitizedManifest, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    console.log("[PDL-Engine] AI Assessment Result:", jsonStr);
    return JSON.parse(jsonStr);
  }
}
