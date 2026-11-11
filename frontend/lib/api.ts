/**
 * API layer.
 *
 * - Health, Knowledge Base (documents) and Chat answers call the REAL backend.
 * - Chat history and My Uploads have no backend yet. There is NO sample data:
 *   lists are empty and actions say clearly that they are not connected. Each of
 *   those functions has the signature the real one will have, so later you only
 *   replace the body with `request(...)`.
 */
import type {
  ApiHealth,
  Chat,
  DbHealth,
  DocStatus,
  FileKind,
  KnowledgeDoc,
  OllamaHealth,
  Source,
  UploadResult,
  UserUpload,
} from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

/* ------------------------------------------------------------ real calls */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = 15_000,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the backend. Check that the API server is running.",
    );
  }
  if (!res.ok) throw new ApiError(await readErrorDetail(res), res.status);
  return res.json() as Promise<T>;
}

/** The "detail" message FastAPI puts in error responses. */
async function readErrorDetail(res: Response): Promise<string> {
  let detail = res.statusText;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (Array.isArray(body?.detail))
      detail = body.detail.map((d: { msg?: string }) => d.msg).join("; ");
  } catch {
    /* body was not JSON */
  }
  return detail;
}

export const getApiHealth = () => request<ApiHealth>("/health");
export const getDbHealth = () => request<DbHealth>("/health/db");
export const getOllamaHealth = () => request<OllamaHealth>("/health/ollama");

/* ------------------------------------------- knowledge base (real backend) */

/** What the knowledge base accepts. The backend enforces the same rules. */
export const KNOWLEDGE_FILE_TYPES = [
  "pdf", "docx", "pptx", "xlsx", "csv", "txt", "jpg", "jpeg", "png", "tif", "tiff",
];
export const KNOWLEDGE_ACCEPT = KNOWLEDGE_FILE_TYPES.map((t) => `.${t}`).join(",");
export const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 50);

/** One row of GET /documents. */
interface ApiDocument {
  doc_id: number;
  file_name: string;
  file_type: string | null;
  source_type: string;
  status: string;
  page_count: number | null;
  chunk_count: number | null;
  error_message: string | null;
  uploaded_at: string | null;
  indexed_at: string | null;
  can_reindex?: boolean;
}

const DOC_STATUSES: DocStatus[] = ["ready", "processing", "failed", "pending", "archived"];

function kindFromType(type: string | null): FileKind {
  switch ((type ?? "").toLowerCase()) {
    case "pdf": return "pdf";
    case "docx": return "docx";
    case "pptx": return "pptx";
    case "xlsx": return "xlsx";
    case "csv": return "csv";
    case "txt": return "txt";
    default: return "image";
  }
}

function toKnowledgeDoc(d: ApiDocument): KnowledgeDoc {
  const status = d.status.toLowerCase() as DocStatus;
  return {
    id: d.doc_id,
    name: d.file_name,
    kind: kindFromType(d.file_type),
    status: DOC_STATUSES.includes(status) ? status : "pending",
    pages: d.page_count,
    chunks: d.chunk_count,
    uploadedAt: d.uploaded_at,
    indexedAt: d.indexed_at,
    error: d.error_message ?? undefined,
    canReindex: d.can_reindex ?? false,
  };
}

/** GET /documents (knowledge base documents, newest first) */
export async function listKnowledgeDocs(): Promise<KnowledgeDoc[]> {
  const rows = await request<ApiDocument[]>("/documents?source_type=KNOWLEDGE");
  return rows.map(toKnowledgeDoc);
}

/** POST /documents/upload: files are saved now and indexed in the background. */
export function uploadDocuments(files: File[]): Promise<UploadResult> {
  const body = new FormData();
  files.forEach((f) => body.append("files", f));
  return request<UploadResult>("/documents/upload", { method: "POST", body }, 10 * 60_000);
}

/** POST /documents/{id}/reindex */
export function reindexDoc(id: number) {
  return request<{ queued: boolean }>(`/documents/${id}/reindex`, { method: "POST" });
}

/** DELETE /documents/{id} */
export function deleteKnowledgeDoc(id: number) {
  return request<{ deleted: boolean; file_removed: boolean }>(`/documents/${id}`, {
    method: "DELETE",
  });
}

/* ------------------------------------------------- chat (real, streaming) */

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ChatStreamHandlers {
  /** The documents the answer is based on (arrives first). */
  onSources: (sources: Source[]) => void;
  /** A piece of the answer text. */
  onToken: (text: string) => void;
}

/** One line of the POST /chat response (newline-delimited JSON). */
type ChatEvent =
  | {
      type: "sources";
      sources: { file_name: string; page: number | null; similarity: number; text: string }[];
    }
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * POST /chat. Calls the handlers while the answer streams in and resolves when
 * it is complete. Throws ApiError if the backend is down or reports an error,
 * and the browser's AbortError if `signal` is aborted (the Stop button).
 */
export async function streamChat(
  message: string,
  history: ChatHistoryItem[],
  signal: AbortSignal,
  handlers: ChatStreamHandlers,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
      cache: "no-store",
      signal,
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new ApiError("Cannot reach the backend. Check that the API server is running.");
  }
  if (!res.ok) throw new ApiError(await readErrorDetail(res), res.status);
  if (!res.body) throw new ApiError("The backend sent an empty response.");

  let finished = false;
  const handle = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as ChatEvent;
    if (event.type === "sources") {
      handlers.onSources(
        event.sources.map((s, i) => ({
          id: `s${i + 1}`,
          file: s.file_name,
          page: s.page,
          quote: s.text,
        })),
      );
    } else if (event.type === "token") {
      handlers.onToken(event.text);
    } else if (event.type === "done") {
      finished = true;
    } else if (event.type === "error") {
      throw new ApiError(event.message);
    }
  };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        handle(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
      }
    }
    handle(buffer);
  } catch (e) {
    if (e instanceof ApiError || signal.aborted) throw e;
    throw new ApiError("The connection to the backend was lost while answering.");
  }
  if (!finished) {
    throw new ApiError("The connection to the backend was lost before the answer finished.");
  }
}

/* ------------------------------------- not connected yet (no sample data) */

// Chats created in this browser session, so the sidebar works while the page
// stays open. The real backend will store chats later.
const chatStore: Chat[] = [];

/** TODO: GET /chats (the real backend will return saved chats) */
export async function listChats(): Promise<Chat[]> {
  return structuredClone(chatStore);
}

/** TODO: persisted by the backend; here we only keep the sidebar in sync. */
export function saveChat(chat: Chat): void {
  const i = chatStore.findIndex((c) => c.id === chat.id);
  if (i >= 0) chatStore[i] = chat;
  else chatStore.unshift(chat);
}

/** TODO: GET /uploads (no backend yet, so the list is empty) */
export async function listUploads(): Promise<UserUpload[]> {
  return [];
}

/** TODO: DELETE /uploads/{id} */
export async function deleteUpload(id: string): Promise<void> {
  void id; // nothing is stored yet, so there is nothing to delete
}

export function fileKindFromName(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "pptx" || ext === "ppt") return "pptx";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "csv") return "csv";
  if (ext === "txt") return "txt";
  return "image";
}

/** TODO: POST /uploads (multipart/form-data) */
export async function uploadFile(file: File): Promise<UserUpload> {
  // No upload endpoint exists yet, so we must not pretend the file was saved.
  void file;
  throw new ApiError(
    "Chat file uploads are not connected to the backend yet, so this file was not uploaded.",
  );
}

export const ACCEPTED_UPLOADS =
  ".pdf,.docx,.pptx,.xlsx,.csv,.jpg,.jpeg,.png";
export const UPLOAD_RETENTION_DAYS = 5;
