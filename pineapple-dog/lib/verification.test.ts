import { PDLEngine, ClaimManifest } from "./verification";

async function runTests() {
  const engine = new PDLEngine();

  console.log("--- Testing Tier 1 Claim (Property) ---");
  const tier1Manifest: ClaimManifest = {
    claim_id: "PDL-2026-001",
    submission_date: "2026-03-07T21:42:07Z",
    disaster_info: {
      name: "Central District Flash Flood",
      date: "2026-03-07",
      details: "Heavy rainfall causing flash floods in Orchard area.",
      location: "Singapore"
    },
    title: "Central District Flash Flood Relief",
    description: "Immediate relief claim for flash flood impact.",
    amount_requested: 5000.00,
    selected_category: "PROPERTY",
    category_details: {
      property: {
        home_address: "123 Orchard Road, Singapore 238823",
        registry_match: true,
        satellite_damage_img: "https://pdl-imagery.sg/satellite/SG-FLOOD-05/123-orchard.jpg"
      }
    }
  };
  const result1 = await engine.processClaim(tier1Manifest);
  console.log("Score:", result1.verification_results.calculated_score);
  console.log("Tier:", result1.verification_results.triage_tier);
  console.log("Payout:", result1.verification_results.disbursement.payout_percentage + "%");
  console.log("Status:", result1.verification_results.disbursement.status);
  console.log("");

  console.log("--- Testing Tier 2 Claim (Presence) ---");
  const tier2Manifest: ClaimManifest = {
    claim_id: "PDL-2026-002",
    submission_date: "2026-03-07T21:50:00Z",
    disaster_info: {
      name: "Central District Flash Flood",
      date: "2026-03-07",
      details: "Heavy rainfall causing flash floods in Orchard area.",
      location: "Singapore"
    },
    title: "Commuter Impact Allowance",
    description: "I was stranded at Orchard MRT during the flash flood.",
    amount_requested: 1000.00,
    selected_category: "PRESENCE",
    category_details: {
      presence: {
        gps_location_logs: [
          { lat: 1.3040, lng: 103.8330 }, // Orchard MRT coordinates
          { lat: 1.3048, lng: 103.8318 }
        ],
        telecom_tower_data: "https://telecom-logs.sg/tower-ping/user-8823/SG-FLOOD-05",
        geotagged_media: "https://pdl-storage.sg/media/claim-002/photo.jpg"
      }
    }
  };
  const result2 = await engine.processClaim(tier2Manifest);
  console.log("Score:", result2.verification_results.calculated_score);
  console.log("Tier:", result2.verification_results.triage_tier);
  console.log("Payout:", result2.verification_results.disbursement.payout_percentage + "%");
  console.log("Status:", result2.verification_results.disbursement.status);
  console.log("");

  console.log("--- Testing Tier 3 Claim (Livelihood - Incomplete) ---");
  const tier3Manifest: ClaimManifest = {
    claim_id: "PDL-2026-003",
    submission_date: "2026-03-07T22:00:00Z",
    disaster_info: {
      name: "UNKNOWN",
      date: "2026-03-07",
      details: "Bad things happened."
    },
    title: "Vague Claim",
    description: "Bad things happened.",
    amount_requested: 100.00,
    selected_category: "LIVELIHOOD",
    category_details: {
      livelihood: {
        business_uen: "",
        sector: "Generic",
        income_loss_proof: ""
      }
    }
  };
  const result3 = await engine.processClaim(tier3Manifest);
  console.log("Score:", result3.verification_results.calculated_score); 
  console.log("Tier:", result3.verification_results.triage_tier);
  console.log("Status:", result3.verification_results.disbursement.status);
  
  console.log("\n--- Full Flow Verification Complete ---");
  console.log("Check Firebase Console under 'claims/' to verify persistence.");
  
  // Give time for database async operation to finish if needed
  await new Promise(resolve => setTimeout(resolve, 2000));
}

runTests().catch(console.error);
