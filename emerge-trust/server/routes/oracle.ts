import { Router, type Request, type Response } from "express";
import { rtdb } from "../lib/firebaseAdmin";

const router = Router();

const NEWS_API_KEY = process.env.NEWS_API_KEY ?? "";
const DISASTER_KEYWORDS = ["Flash Flood", "Flood Alert", "Disaster", "Emergency"];

// ─── Poll and evaluate oracle conditions ─────────────────────────────────────
// POST /api/oracle/poll
router.post("/poll", async (_req: Request, res: Response) => {
  try {
    const zonesSnap = await rtdb.ref("disasterZones").get();
    const results: Array<{ zoneId: string; activated: boolean }> = [];

    if (zonesSnap.exists()) {
      const updates: Record<string, any> = {};
      for (const [zoneId, zone] of Object.entries<any>(zonesSnap.val())) {
        if (zone.status === "inactive") {
          const hasNewsMatch = await checkNewsAPI(zone.name, zone.newsKeywords ?? DISASTER_KEYWORDS);
          const hasSensorAlert = (zone.currentSensorLevel ?? 0) >= (zone.sensorThreshold ?? 80);

          if (hasNewsMatch && hasSensorAlert) {
            updates[`disasterZones/${zoneId}/status`] = "active";
            updates[`disasterZones/${zoneId}/activatedAt`] = new Date().toISOString();
            results.push({ zoneId, activated: true });
          } else {
            results.push({ zoneId, activated: false });
          }
        }
      }
      if (Object.keys(updates).length > 0) {
        await rtdb.ref().update(updates);
      }
    }

    return res.json({ polled: results.length, results });
  } catch (err) {
    console.error("[oracle/poll] error:", err);
    return res.status(500).json({ message: "Oracle poll failed" });
  }
});

// ─── The Unified Scoring Bot (Phase 1) ─────────────────────────────────────────
// POST /api/oracle/score
router.post("/score", async (req: Request, res: Response) => {
  const { claimId, category, userId, zoneId } = req.body;

  if (!claimId || !category || !userId || !zoneId) {
    return res.status(400).json({ message: "Missing claim context" });
  }

  try {
    // 1. Determine base score dynamically via category heuristics.
    let botScore = 0;

    // MOCK Oracle Checks: 
    // In production, Property calls Map/HDB registries. Presence pings telcom/GPS. Livelihood pings ACRA/Business nets.
    switch (category) {
      case "property":
        // 60-95 base for typical structural evidence
        botScore = Math.floor(Math.random() * 35) + 60;
        break;
      case "presence":
        // 75-100 base for GPS pings - easier to prove automatically
        botScore = Math.floor(Math.random() * 25) + 75;
        break;
      case "livelihood":
        // 40-85 base - much harder to prove economic impact automatically
        botScore = Math.floor(Math.random() * 45) + 40;
        break;
      default:
        botScore = 50;
    }

    // 2. The Verdict Engine
    let newStatus = "voting";

    if (botScore >= 80) {
      // Phase 1 Pass: Triggers 20% ILP instant stream
      newStatus = "tier1_paid";
      // TODO: Chain to ILP OpenPayments transaction endpoint to disburse the tier 1 amount
    } else if (botScore < 50) {
      // Phase 1 Fail: Rejection / Slashing
      newStatus = "rejected";
    } else {
      // Phase 2: Priority Human Review
      newStatus = "voting";
    }

    // 3. Persist the Bot's ruling on the claim
    await rtdb.ref(`claims/${claimId}`).update({
      botScore,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    return res.json({ success: true, botScore, status: newStatus });
  } catch (err) {
    console.error("[oracle/score] error:", err);
    return res.status(500).json({ message: "Scoring bot failed." });
  }
});

// ─── Manual oracle injection (admin/simulation) ───────────────────────────────
// POST /api/oracle/inject
router.post("/inject", async (req: Request, res: Response) => {
  const { zoneId, keyword } = req.body as { zoneId: string; keyword?: string };
  if (!zoneId) return res.status(400).json({ message: "zoneId is required" });

  try {
    await rtdb.ref(`disasterZones/${zoneId}`).update({
      status: "active",
      activatedAt: new Date().toISOString(),
      lastInjectedKeyword: keyword ?? "Manual Trigger",
    });
    return res.json({ success: true, zoneId, status: "active" });
  } catch (err) {
    console.error("[oracle/inject] error:", err);
    return res.status(500).json({ message: "Failed to inject oracle" });
  }
});

// ─── Update sensor level ──────────────────────────────────────────────────────
// POST /api/oracle/sensor
router.post("/sensor", async (req: Request, res: Response) => {
  const { zoneId, level } = req.body as { zoneId: string; level: number };
  if (!zoneId || typeof level !== "number") return res.status(400).json({ message: "zoneId and level required" });

  try {
    await rtdb.ref(`disasterZones/${zoneId}`).update({
      currentSensorLevel: level,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update sensor" });
  }
});

// ─── Helper: Check NewsAPI ────────────────────────────────────────────────────
async function checkNewsAPI(
  locationName: string,
  keywords: string[]
): Promise<boolean> {
  if (!NEWS_API_KEY) return false;
  try {
    const query = encodeURIComponent(`${locationName} (${keywords.join(" OR ")})`);
    const url = `https://newsapi.org/v2/everything?q=${query}&pageSize=5&apiKey=${NEWS_API_KEY}`;
    const res = await fetch(url);
    const data = (await res.json()) as { articles?: Array<{ title: string; description: string }> };
    return (data.articles?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export default router;
