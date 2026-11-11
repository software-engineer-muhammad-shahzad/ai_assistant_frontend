"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, SendHorizontal, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/ui/file-icon";
import {
  ACCEPTED_UPLOADS,
  UPLOAD_RETENTION_DAYS,
  fileKindFromName,
  uploadFile,
} from "@/lib/api";
import { cn, uid } from "@/lib/utils";

interface Attachment {
  id: string;
  name: string;
  uploading: boolean;
}

const ALLOWED = ACCEPTED_UPLOADS.split(",");

export function ChatInput({
  disabled,
  onSend,
  onStop,
  prefill,
}: {
  /** True while an answer is being produced: sending is blocked. */
  disabled: boolean;
  onSend: (text: string, attachmentNames: string[]) => void;
  /** While `disabled`, the Send button turns into a Stop button that calls this. */
  onStop?: () => void;
  /** Setting a new `{ text }` object fills the box (used by example questions). */
  prefill?: { text: string } | null;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fill the box when a new example question is picked (state adjusted during render, per React docs).
  const [seenPrefill, setSeenPrefill] = useState(prefill);
  if (prefill !== seenPrefill) {
    setSeenPrefill(prefill);
    if (prefill) setText(prefill.text);
  }
  useEffect(() => {
    if (prefill) taRef.current?.focus();
  }, [prefill]);

  // Auto-grow the textarea up to a limit.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  const uploading = files.some((f) => f.uploading);
  const canSend = text.trim().length > 0 && !disabled && !uploading;

  function submit() {
    if (!canSend) return;
    onSend(text.trim(), files.map((f) => f.name));
    setText("");
    setFiles([]);
    setError(null);
  }

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    for (const file of Array.from(list)) {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!ALLOWED.includes(ext)) {
        setError(`“${file.name}” is not supported. Allowed: PDF, DOCX, PPTX, XLSX, CSV, JPG, PNG.`);
        continue;
      }
      const id = uid();
      setFiles((prev) => [...prev, { id, name: file.name, uploading: true }]);
      try {
        await uploadFile(file);
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, uploading: false } : f)));
      } catch (e) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setError(
          e instanceof Error
            ? e.message
            : `Could not upload “${file.name}”. Please try again.`,
        );
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="border-t border-border bg-background px-3 pb-3 pt-2 md:px-6">
      <div className="mx-auto max-w-3xl">
        {files.length > 0 && (
          <div className="mb-2">
            <ul className="flex flex-wrap gap-2" aria-label="Attached files">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-surface py-1 pl-2 pr-1 text-xs"
                >
                  {f.uploading ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Uploading" />
                  ) : (
                    <FileIcon kind={fileKindFromName(f.name)} className="size-4" />
                  )}
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                    className="rounded p-0.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Uploaded files are auto-deleted after {UPLOAD_RETENTION_DAYS} days.
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="mb-2 text-xs text-danger">
            {error}
          </p>
        )}

        <div
          className={cn(
            "flex items-end gap-1.5 rounded-xl border border-border bg-surface p-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
          )}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPTED_UPLOADS}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="Attach files"
            tabIndex={-1}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach files (PDF, DOCX, PPTX, XLSX, CSV, JPG, PNG)"
            title="Attach files"
          >
            <Paperclip />
          </Button>
          <label htmlFor="chat-message" className="sr-only">
            Ask a safety question
          </label>
          <textarea
            id="chat-message"
            ref={taRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask a safety question…"
            className="max-h-44 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-[0.9375rem] leading-snug outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          />
          {disabled && onStop ? (
            <Button
              onClick={onStop}
              variant="secondary"
              size="icon"
              aria-label="Stop generating"
              title="Stop generating"
            >
              <Square className="fill-current" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={!canSend} size="icon" aria-label="Send message">
              <SendHorizontal />
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Enter to send · Shift+Enter for a new line. Answers come from approved
          documents; check the sources.
        </p>
      </div>
    </div>
  );
}
