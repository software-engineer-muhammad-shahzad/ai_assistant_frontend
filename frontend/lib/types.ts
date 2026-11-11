export type FileKind = "pdf" | "docx" | "pptx" | "xlsx" | "csv" | "txt" | "image";
export type DocStatus = "ready" | "processing" | "failed" | "pending" | "archived";

export interface Source {
  id: string;
  file: string;
  page: number | null;
  quote: string;
}

export interface BreakdownItem {
  label: string;
  value: number;
  percent: number;
}

export interface DataResult {
  title: string;
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: Record<string, string | number>[];
  breakdown: BreakdownItem[];
  breakdownLabel: string;
  recordCount: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: Source[];
  data?: DataResult;
  attachments?: string[];
  /** True for a message that reports a problem (backend down, model error). */
  error?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
}

export interface KnowledgeDoc {
  id: number; // doc_id in the database
  name: string;
  kind: FileKind;
  status: DocStatus;
  pages: number | null;
  chunks: number | null;
  uploadedAt: string | null;
  indexedAt: string | null;
  error?: string;
  /** False when the original file is not stored (uploads are removed after indexing). */
  canReindex: boolean;
}

/** Result of POST /documents/upload. */
export interface UploadResult {
  accepted: { file_name: string; size_bytes: number }[];
  rejected: { file_name: string; reason: string }[];
}

export interface UserUpload {
  id: string;
  name: string;
  kind: FileKind;
  sizeBytes: number;
  status: DocStatus;
  uploadedAt: string;
  expiresAt: string;
}

/* Shapes returned by the real backend health endpoints. */
export interface ApiHealth {
  status: string;
}
export interface DbHealth {
  oracle: string;
  documents: number;
  chunks: number;
}
export interface OllamaHealth {
  ollama: string;
  embed_model: string;
  embedding_size: number;
}
