"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Files, Layers, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorNotice } from "@/components/ui/empty-state";
import { FILE_KIND_LABEL, FileIcon } from "@/components/ui/file-icon";
import { Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { useAsync } from "@/hooks/use-async";
import {
  deleteKnowledgeDoc,
  listKnowledgeDocs,
  reindexDoc,
  uploadDocuments,
} from "@/lib/api";
import type { DocStatus, FileKind, KnowledgeDoc } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { KnowledgeSkeleton } from "./knowledge-skeleton";
import { UploadDialog } from "./upload-dialog";

const POLL_MS = 3000;
const isActive = (s: DocStatus) => s === "pending" || s === "processing";

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Files;
  tone?: "default" | "danger";
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div
        className={
          tone === "danger" && value > 0
            ? "flex size-10 items-center justify-center rounded-md bg-danger-bg text-danger"
            : "flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground"
        }
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

export function KnowledgeView() {
  const { data, loading, error, reload, refresh, setData } = useAsync(listKnowledgeDocs);
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocStatus>("all");
  const [kind, setKind] = useState<"all" | FileKind>("all");
  const [toDelete, setToDelete] = useState<KnowledgeDoc | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // While anything is waiting or being indexed, refresh every 3 seconds.
  // Polling stops by itself once every document is READY or FAILED.
  const hasActive = data?.some((d) => isActive(d.status)) ?? false;
  useEffect(() => {
    if (!hasActive) return;
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [hasActive, refresh]);

  // Tell the user when a document finishes (or fails), matched by file name.
  const lastStatus = useRef<Map<string, DocStatus> | null>(null);
  useEffect(() => {
    if (!data) return;
    const before = lastStatus.current;
    if (before) {
      for (const d of data) {
        const was = before.get(d.name);
        if (was && isActive(was) && d.status === "ready")
          toast.success(`“${d.name}” is indexed and ready.`);
        else if (was && isActive(was) && d.status === "failed")
          toast.error(`Indexing failed for “${d.name}”. See the error in the list.`);
      }
    }
    lastStatus.current = new Map(data.map((d) => [d.name, d.status]));
  }, [data, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (d) =>
        (status === "all" || d.status === status) &&
        (kind === "all" || d.kind === kind) &&
        (!q || d.name.toLowerCase().includes(q)),
    );
  }, [data, query, status, kind]);

  const totals = useMemo(() => {
    const docs = data ?? [];
    return {
      total: docs.length,
      chunks: docs.reduce((n, d) => n + (d.chunks ?? 0), 0),
      failed: docs.filter((d) => d.status === "failed").length,
    };
  }, [data]);

  async function handleUpload(files: File[]) {
    // Throws on network / server errors; the dialog shows that message.
    const result = await uploadDocuments(files);
    for (const r of result.rejected) toast.error(r.reason);
    if (result.accepted.length > 0) {
      const n = result.accepted.length;
      toast.success(
        n === 1
          ? `“${result.accepted[0].file_name}” uploaded. Indexing will start shortly.`
          : `${n} files uploaded. Indexing will run one file at a time.`,
      );
    }
    await refresh();
  }

  async function handleReindex(doc: KnowledgeDoc) {
    setBusyId(doc.id);
    try {
      await reindexDoc(doc.id);
      toast.info(`Re-indexing “${doc.name}”…`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Re-index failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(doc: KnowledgeDoc) {
    setBusyId(doc.id);
    try {
      await deleteKnowledgeDoc(doc.id);
      setData((prev) => prev.filter((d) => d.id !== doc.id));
      setToDelete(null);
      toast.success(`“${doc.name}” was deleted.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  const filtersActive = query !== "" || status !== "all" || kind !== "all";

  return (
    <PageContainer>
      <PageHeader
        title="Knowledge Base"
        description="Policy, SOP and reference documents the assistant can answer from."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload /> Upload documents
          </Button>
        }
      />

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onSubmit={handleUpload} />

      {loading && <KnowledgeSkeleton />}

      {error && (
        <ErrorNotice
          title="Could not load documents"
          message={error}
          action={<Button variant="secondary" size="sm" onClick={reload}>Try again</Button>}
        />
      )}

      {data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Total documents" value={totals.total} icon={Files} />
            <StatCard label="Total chunks" value={totals.chunks} icon={Layers} />
            <StatCard label="Failed" value={totals.failed} icon={AlertTriangle} tone="danger" />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-52 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <label htmlFor="kb-search" className="sr-only">Search documents</label>
              <Input
                id="kb-search"
                type="search"
                placeholder="Search documents…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="kb-status" className="sr-only">Filter by status</label>
              <Select id="kb-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="all">All statuses</option>
                <option value="ready">Ready</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </Select>
            </div>
            <div>
              <label htmlFor="kb-kind" className="sr-only">Filter by file type</label>
              <Select id="kb-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                <option value="all">All file types</option>
                {(Object.keys(FILE_KIND_LABEL) as FileKind[]).map((k) => (
                  <option key={k} value={k}>{FILE_KIND_LABEL[k]}</option>
                ))}
              </Select>
            </div>
          </div>

          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={filtersActive ? "No documents match your filters" : "No documents indexed yet"}
                description={
                  filtersActive
                    ? "Try a different search or clear the filters."
                    : "Upload your policy and SOP files. They will appear here while they are indexed."
                }
                action={
                  !filtersActive ? (
                    <Button onClick={() => setUploadOpen(true)}>
                      <Upload /> Upload documents
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setQuery("");
                        setStatus("all");
                        setKind("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  )
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <caption className="sr-only">Indexed documents</caption>
                  <thead>
                    <tr className="border-b border-border bg-surface-muted text-left text-muted-foreground">
                      <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Pages</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Chunks</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Indexed</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => (
                      <tr key={d.id} className="border-b border-border align-top last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <FileIcon kind={d.kind} className="mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-medium break-words">{d.name}</p>
                              {d.status === "failed" && d.error && (
                                <p className="mt-1 text-xs text-danger">{d.error}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-right tabular-nums">{d.pages ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{d.chunks ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatDate(d.indexedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busyId === d.id || isActive(d.status) || !d.canReindex}
                              onClick={() => handleReindex(d)}
                              aria-label={`Re-index ${d.name}`}
                              title={
                                d.canReindex
                                  ? undefined
                                  : "The original file is not stored after indexing. Upload the file again to re-index it."
                              }
                            >
                              <RefreshCw /> Re-index
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-danger hover:bg-danger-bg"
                              disabled={busyId === d.id}
                              onClick={() => setToDelete(d)}
                              aria-label={`Delete ${d.name}`}
                            >
                              <Trash2 /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {totals.total} documents.
          </p>
        </>
      )}

      <ConfirmDeleteDialog
        open={toDelete !== null}
        title="Delete this document?"
        description={
          toDelete
            ? `“${toDelete.name}” and all its indexed chunks will be removed. The assistant will no longer answer from it.`
            : ""
        }
        busy={busyId !== null && busyId === toDelete?.id}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && handleDelete(toDelete)}
      />
    </PageContainer>
  );
}
