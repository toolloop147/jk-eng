import dotenv from "dotenv";

dotenv.config();

import cors from "cors";
import express from "express";
import path from "path";
import authRoutes from "./auth/routes";
import fileRoutes from "./files/routes";
import { runMigrations } from "./db/migrate";
import { getPool } from "./db/pool";
import { seedAdmin } from "./db/seed";
import { getUploadRoot, isPrivateUploadPath } from "./uploads/storage";

const app = express();
const port = Number(process.env.PORT) || 4002;
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:3002";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "25mb" }));
app.use("/uploads", (req, res, next) => {
  if (isPrivateUploadPath(req.path)) {
    res.status(404).end();
    return;
  }
  express.static(path.join(getUploadRoot()))(req, res, next);
});

app.get("/health", async (_req, res) => {
  try {
    await getPool().query("SELECT 1");
    res.json({ status: "ok", service: "jk-eng-api", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", service: "jk-eng-api", database: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

app.listen(port, async () => {
  try {
    await runMigrations();
    await seedAdmin();
  } catch (err) {
    console.warn("Database setup skipped:", err);
  }
  console.log(`API server running on http://localhost:${port}`);
});
