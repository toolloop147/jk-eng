import { Router, Request, Response } from "express";
import { authenticate } from "../auth/middleware";

const router = Router();
const INS_API_URL = process.env.INS_API_URL || "http://localhost:4000";

router.use(authenticate);

router.all("/*path", async (req: Request, res: Response) => {
  try {
    const targetPath = req.originalUrl.replace(/^\/api\/ins/, "/api");
    const targetUrl = `${INS_API_URL}${targetPath}`;

    const headers: Record<string, string> = {};
    const auth = req.headers.authorization;
    if (auth) headers.authorization = auth;

    const contentType = req.headers["content-type"];
    if (contentType) headers["content-type"] = contentType;

    const hasBody = !["GET", "HEAD"].includes(req.method.toUpperCase());
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    });

    const text = await response.text();
    const responseType = response.headers.get("content-type");
    if (responseType) res.setHeader("content-type", responseType);
    res.status(response.status).send(text);
  } catch (err) {
    console.error("[ins-proxy]", err);
    res.status(502).json({
      error: "JK-INS API에 연결할 수 없습니다. JK-INS 백엔드(기본 4000) 실행 여부를 확인하세요.",
    });
  }
});

export default router;
