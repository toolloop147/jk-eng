import fs from "fs";
import path from "path";

const APP_CODE = process.env.APP_CODE || "eng";
const defaultUploadRoot = path.resolve(__dirname, "../../uploads");

export function resolveUploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) return path.resolve(configured);
  return defaultUploadRoot;
}

export function getUploadRoot(): string {
  return resolveUploadRoot();
}

export function publicApiBase(): string {
  return process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
}

export function resolveStoredFilePath(storedPath: string): string {
  const normalized = storedPath.replace(/\\/g, "/");
  const prefix = `${APP_CODE}/`;
  if (!normalized.startsWith(prefix)) {
    throw new Error("Invalid stored file path");
  }

  const absolute = path.resolve(getUploadRoot(), normalized);
  const rootWithSep = `${getUploadRoot()}${path.sep}`;
  if (!absolute.startsWith(rootWithSep) && absolute !== getUploadRoot()) {
    throw new Error("Invalid stored file path");
  }

  return absolute;
}

export async function ensureUploadDir(relativeDir: string): Promise<string> {
  const dir = path.join(getUploadRoot(), relativeDir);
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

export function isPrivateUploadPath(urlPath: string): boolean {
  return urlPath.startsWith(`/${APP_CODE}/`);
}

export const STORED_FILES_TABLE = "eng_stored_files";
