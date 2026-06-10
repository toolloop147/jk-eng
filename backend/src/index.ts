import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "jk-eng-api" });
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
