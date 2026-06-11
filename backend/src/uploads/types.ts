export type UploadFileInput = {
  name: string;
  base64: string;
  mimeType?: string;
};

export type StoredFileRecord = {
  entityType: string;
  entityId: string;
  fileKind: string;
  storedPath: string;
  originalName: string;
  mimeType: string | null;
  fileSize: number;
};
