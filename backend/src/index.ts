import dotenv from "dotenv";

dotenv.config();

import cors from "cors";
import express from "express";
import authRoutes from "./auth/routes";
import { getPool } from "./db/pool";
import { seedAdmin } from "./db/seed";

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await getPool().query("SELECT 1");
    res.json({ status: "ok", service: "jk-eng-api", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", service: "jk-eng-api", database: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);

app.listen(port, async () => {
  try {
    await seedAdmin();
  } catch (err) {
    console.warn("Admin seed skipped:", err);
  }
  console.log(`API server running on http://localhost:${port}`);
});
