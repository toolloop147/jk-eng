import type { PoolClient } from "pg";
import { STORED_FILES_TABLE } from "./storage";
import { StoredFileRecord } from "./types";

export async function persistStoredFile(
  client: PoolClient,
  file: StoredFileRecord
): Promise<string> {
  const result = await client.query(
    `INSERT INTO ${STORED_FILES_TABLE} (
       entity_type, entity_id, file_kind, original_name, stored_path, mime_type, file_size
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (entity_type, entity_id, file_kind) DO UPDATE SET
       original_name = EXCLUDED.original_name,
       stored_path = EXCLUDED.stored_path,
       mime_type = EXCLUDED.mime_type,
       file_size = EXCLUDED.file_size,
       updated_at = NOW()
     RETURNING id`,
    [
      file.entityType,
      file.entityId,
      file.fileKind,
      file.originalName,
      file.storedPath,
      file.mimeType,
      file.fileSize,
    ]
  );

  return result.rows[0].id as string;
}
