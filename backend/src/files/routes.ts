import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { authenticate } from "../auth/middleware";
import { requireAdmin } from "../auth/requireAdmin";
import { getPool } from "../db/pool";
import { resolveStoredFilePath, STORED_FILES_TABLE } from "../uploads/storage";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/:id", async (req: Request, res: Response) => {
  const fileId = String(req.params.id);

  const fileResult = await getPool().query(
    `SELECT original_name, stored_path, mime_type
     FROM ${STORED_FILES_TABLE}
     WHERE id = $1`,
    [fileId]
  );

  if (fileResult.rows.length === 0) {
    res.status(404).json({ error: "첨부파일을 찾을 수 없습니다." });
    return;
  }

  const { original_name, stored_path, mime_type } = fileResult.rows[0] as {
    original_name: string;
    stored_path: string;
    mime_type: string | null;
  };

  let absolutePath: string;
  try {
    absolutePath = resolveStoredFilePath(stored_path);
  } catch {
    res.status(404).json({ error: "파일 경로가 올바르지 않습니다." });
    return;
  }

  if (!fs.existsSync(absolutePath)) {
    res.status(404).json({ error: "서버에 저장된 파일이 없습니다." });
    return;
  }

  const disposition =
    req.query.disposition === "attachment" ? "attachment" : "inline";
  const encodedName = encodeURIComponent(original_name);
  const asciiName = original_name.replace(/[^\x20-\x7E]/g, "_");

  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`
  );
  if (mime_type) {
    res.setHeader("Content-Type", mime_type);
  } else {
    res.type(path.extname(original_name) || "application/octet-stream");
  }

  res.sendFile(absolutePath);
});

export default router;
