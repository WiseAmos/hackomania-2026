import { Router, type Request, type Response } from "express";
import { db } from "../lib/firebaseAdmin";

const router = Router();

const NEWS_API_KEY = process.env.NEWS_API_KEY ?? "";
const DISASTER_KEYWORDS = ["Flash Flood", "Flood Alert", "Disaster", "Emergency"];

// ─── Poll and evaluate oracle conditions ─────────────────────────────────────
// POST /api/oracle/poll
router.post("/poll", async (_req: Request, res: Response) => {
  try {
    const zonesSnap = await db.collection("disasterZones").where("status", "==", "inactive").get();
    const results: Array<{ zoneId: string; activated: boolean }> = [];

    for (const zoneDoc of zonesSnap.docs) {
      const zone = zoneDoc.data();
      const hasNewsMatch = await checkNewsAPI(zone.name, zone.newsKeywords ?? DISASTER_KEYWORDS);
      const hasSensorAlert =
        (zone.currentSensorLevel ?? 0) >= (zone.sensorThreshold ?? 80);

      if (hasNewsMatch && hasSensorAlert) {
        await zoneDoc.ref.update({
          status: "active",
          activatedAt: new Date().toISOString(),
        });
        results.push({ zoneId: zoneDoc.id, activated: true });
      } else {
        results.push({ zoneId: zoneDoc.id, activated: false });
      }
    }

    return res.json({ polled: results.length, results });
  } catch (err) {
    console.error("[oracle/poll] error:", err);
    return res.status(500).json({ message: "Oracle poll failed" });
  }
});

// ─── Manual oracle injection (admin/simulation) ───────────────────────────────
// POST /api/oracle/inject
router.post("/inject", async (req: Request, res: Response) => {
  const { zoneId, keyword } = req.body as { zoneId: string; keyword?: string };

  if (!zoneId) {
    return res.status(400).json({ message: "zoneId is required" });
  }

  try {
    await db.collection("disasterZones").doc(zoneId).update({
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

  if (!zoneId || typeof level !== "number") {
    return res.status(400).json({ message: "zoneId and level required" });
  }

  try {
    await db.collection("disasterZones").doc(zoneId).update({
      currentSensorLevel: level,
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("[oracle/sensor] error:", err);
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
    const query = encodeURIComponent(
      `${locationName} (${keywords.join(" OR ")})`
    );
    const url = `https://newsapi.org/v2/everything?q=${query}&pageSize=5&apiKey=${NEWS_API_KEY}`;
    const res = await fetch(url);
    const data = (await res.json()) as { articles?: Array<{ title: string; description: string }> };

    return (data.articles?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export default router;
