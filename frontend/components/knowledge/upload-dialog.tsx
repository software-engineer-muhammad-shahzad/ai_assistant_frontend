"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileIcon } from "@/components/ui/file-icon";
import {
  KNOWLEDGE_ACCEPT,
  KNOWLEDGE_FILE_TYPES,
  MAX_UPLOAD_MB,
  fileKindFromName,
} from "@/lib/api";
import { cn, formatBytes } from "@/lib/utils";

const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Check a file against the same rules as the backend. Returns a problem or null. */
function problemWith(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!KNOWLEDGE_FILE_TYPES.includes(ext))
    return `“${file.name}” is not a supported file type.`;
  if (file.size === 0) return `“${file.name}” is empty.`;
  if (file.size > MAX_BYTES)
    return `“${file.name}” is larger than ${MAX_UPLOAD_MB} MB.`;
  return null;
}

export function UploadDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Upload the files. Throw an Error to show a message in the dialog. */
  onSubmit: (files: File[]) => Promise<void>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | File[]) {
    const accepted: File[] = [];
    const bad: string[] = [];
    for (const file of Array.from(list)) {
      const problem = problemWith(file);
      if (problem) bad.push(problem);
      else accepted.push(file);
    }
    setProblems(bad);
    setError(null);
    // A file with the same name replaces the one already in the list.
    setFiles((prev) => [
      ...prev.filter((p) => !accepted.some((a) => a.name === p.name)),
      ...accepted,
    ]);
  }

  function close(next: boolean) {
    if (uploading) return; // do not close while uploading
    if (!next) {
      setFiles([]);
      setProblems([]);
      setError(null);
      setDragging(false);
    }
    onOpenChange(next);
  }

  async function submit() {
    setUploading(true);
    setError(null);
    try {
      await onSubmit(files);
      setFiles([]);
      setProblems([]);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Upload documents</DialogTitle>
        <DialogDescription>
          Add policy, SOP or reference files. They are indexed in the background,
          one at a time.
        </DialogDescription>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!uploading) addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "mt-4 flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragging ? "border-primary bg-accent" : "border-border bg-surface-muted",
          )}
        >
          <UploadCloud className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">Drag and drop files here</p>
          <p className="text-xs text-muted-foreground">or</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={KNOWLEDGE_ACCEPT}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = ""; // allow choosing the same file again
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            Browse files
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Allowed: {KNOWLEDGE_FILE_TYPES.map((t) => t.toUpperCase()).join(", ")}.
            Max {MAX_UPLOAD_MB} MB per file.
          </p>
        </div>

        {problems.length > 0 && (
          <ul role="alert" className="mt-3 space-y-1 text-xs text-danger">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}

        {files.length > 0 && (
          <ul
            aria-label="Files to upload"
            className="mt-3 max-h-48 space-y-1.5 overflow-y-auto"
          >
            {files.map((f) => (
              <li
                key={f.name}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm"
              >
                <FileIcon kind={fileKindFromName(f.name)} className="size-4" />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(f.size)}
                </span>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}
                  className="rounded p-0.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => close(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={files.length === 0 || uploading}>
            {uploading && <Loader2 className="animate-spin" />}
            {uploading
              ? "Uploading…"
              : `Upload ${files.length || ""} ${files.length === 1 ? "file" : "files"}`.replace("  ", " ")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
