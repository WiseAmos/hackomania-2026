import express from "express";
import cors from "cors";
import "dotenv/config";

import transactionRouter from "./routes/transaction";
import oracleRouter from "./routes/oracle";
import claimRouter from "./routes/claim";
import bountyRouter from "./routes/bounty";

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/transaction", transactionRouter);
app.use("/api/oracle", oracleRouter);
app.use("/api/claims", claimRouter);
app.use("/api/bounty", bountyRouter);

// Admin simulation routes (mounted on /api/admin/*)
app.post("/api/admin/simulate-wager-fails", (req, res) => {
  // Forwarded to claim router
  claimRouter(req, res, () => {
    res.status(404).json({ message: "Not found" });
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`EmergeTrust API server running on http://localhost:${PORT}`);
  scheduleOraclePoll();
});

// ─── Oracle polling (every 5 minutes) ────────────────────────────────────────

function scheduleOraclePoll() {
  const POLL_INTERVAL_MS = 5 * 60 * 1000;

  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/api/oracle/poll`, {
        method: "POST",
      });
    } catch (err) {
      console.error("[oracle] poll error:", err);
    }
  }, POLL_INTERVAL_MS);

  console.log(`[oracle] Polling every ${POLL_INTERVAL_MS / 1000}s`);
}

export default app;
