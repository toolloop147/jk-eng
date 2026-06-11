import fs from "fs";
import path from "path";
import { ensureUploadDir } from "./storage";
import { StoredFileRecord, UploadFileInput } from "./types";

const APP_CODE = process.env.APP_CODE || "eng";

function fileExtension(name: string, mimeType?: string): string {
  const fromName = path.extname(name);
  if (fromName) return fromName.toLowerCase();

  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType?.includes("word")) return ".docx";
  return "";
}

export async function saveStoredFile(
  entityType: string,
  entityId: string,
  fileKind: string,
  storedBaseName: string,
  file?: UploadFileInput
): Promise<StoredFileRecord | null> {
  if (!file?.base64 || !file.name) return null;

  const ext = fileExtension(file.name, file.mimeType);
  const storedName = `${storedBaseName}${ext}`;
  const relativeDir = path.posix.join(APP_CODE, entityType, entityId);
  const dir = await ensureUploadDir(relativeDir);
  const fullPath = path.join(dir, storedName);
  const buffer = Buffer.from(file.base64, "base64");
  await fs.promises.writeFile(fullPath, buffer);

  return {
    entityType,
    entityId,
    fileKind,
    storedPath: path.posix.join(relativeDir, storedName),
    originalName: file.name,
    mimeType: file.mimeType ?? null,
    fileSize: buffer.byteLength,
  };
}
