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
    incident_scale?: "PERSONAL" | "MASS";
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
      Role: You are the PDL-Validator, a system that checks whether a disaster description is PLAUSIBLE enough to evaluate.

      CRITICAL: Differentiate between MASS DISASTERS and PERSONAL/LOCALIZED INCIDENTS.

      1. MASS DISASTERS (Regional floods, Earthquakes, Wildfires, etc.):
         - Require strong evidence: "iot_sensor_match" should be PASS only if regional data would exist.
         - news_reports_found should be high (>5).
         - oracle_consensus should be high (>70%).

      2. PERSONAL/LOCALIZED INCIDENTS (House fires, private accidents, localized leaks):
         - BE LENIENT: These are unlikely to appear in global news or regional weather sensors.
         - "iot_sensor_match": Set to PASS if it is plausible that LOCAL sensors (smart home, smoke detectors, localized heat sensors) would have triggered.
         - news_reports_found: Assign 1-2 if it's plausible that a local neighborhood report or emergency log exists.
         - oracle_consensus: Base this on neighborhood plausibility (e.g., 40-60%).

      Guidelines:
      - If the event is believable for its scale, set disaster_verified = true.
      - Never penalize a personal matter for lacking regional news scale.

      OUTPUT FORMAT (JSON ONLY):
      {
        "verification_anchor": {
          "disaster_verified": boolean,
          "confidence_score": number,
          "data_sources": {
            "iot_sensor_match": "PASS" | "FAIL" | "DELAYED",
            "news_reports_found": number,
            "oracle_consensus": number
          },
          "incident_scale": "PERSONAL" | "MASS"
        },
        "event_details": {
          "event_type": string,
          "verified_timestamp": string,
          "impact_radius_km": number
        },
        "issue_explanation": "Short explanation of plausibility vs scale."
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

    CRITICAL: Adapt your scoring based on the SCALE (PERSONAL vs MASS).

    SCORING GUIDELINES:

    1. For PERSONAL/LOCALIZED Matters:
       - Weight INTERNAL CONSISTENCY and CLAIMANT RELEVANCE much higher (70% of score).
       - Be EXTREMELY LENIENT with "External Data" (IoT/News). If the claim is consistent, give a high score even if news is 0.
       - Focus on whether the address match and description are plausible.

    2. For MASS DISASTERS:
       - Cross-reference with real-life events.
       - Stricter requirements: Demand high news counts and IoT data matches.
       - External validation should account for 50% of the score.

    Overall Principles:
    - Moderate-to-high scores for believable claims regardless of scale.
    - Benefit of the doubt always.

    SCORING ALLOCATION (Max 100):
    - 40: Scale-relative Plausibility (Higher importance for mass if external data exists, higher importance for personal if description is detailed).
    - 30: Internal Evidence Consistency.
    - 30: Claimant-Location Connection.

    TRIAGE TIERS:
    Tier 1 (Score ≥ 60): DISBURSED (100% Payout)
    Tier 2 (Score 40-59): PARTIAL_DISBURSED (20% Payout)
    Tier 3 (Score < 40): PENDING_HUMAN_REVIEW

    OUTPUT FORMAT (JSON ONLY):
    {
      "calculated_score": number,
      "triage_tier": number,
      "disbursement": {
        "payout_percentage": number,
        "status": "DISBURSED" | "PARTIAL_DISBURSED" | "PENDING_HUMAN_REVIEW"
      },
      "analysis_explanation": "Context-aware explanation (e.g., 'Verified via local plausibility' vs 'Verified via regional news consensus')."
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
