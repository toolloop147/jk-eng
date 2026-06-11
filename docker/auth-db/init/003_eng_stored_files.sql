-- jk-eng 첨부파일 메타데이터 (실제 파일은 서버 디스크 UPLOAD_DIR에 저장)

CREATE OR REPLACE FUNCTION eng_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS eng_stored_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    file_kind VARCHAR(30) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_eng_stored_files_entity_kind UNIQUE (entity_type, entity_id, file_kind)
);

CREATE INDEX IF NOT EXISTS idx_eng_stored_files_entity ON eng_stored_files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_eng_stored_files_stored_path ON eng_stored_files(stored_path);

DROP TRIGGER IF EXISTS trg_eng_stored_files_updated_at ON eng_stored_files;
CREATE TRIGGER trg_eng_stored_files_updated_at
    BEFORE UPDATE ON eng_stored_files
    FOR EACH ROW EXECUTE FUNCTION eng_set_updated_at();
