"use client";

import { useState } from "react";
import { FolderUp, Info, Trash2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EmptyState, ErrorNotice } from "@/components/ui/empty-state";
import { FileIcon } from "@/components/ui/file-icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAsync } from "@/hooks/use-async";
import { UPLOAD_RETENTION_DAYS, deleteUpload, listUploads } from "@/lib/api";
import type { UserUpload } from "@/lib/types";
import { cn, daysUntil, formatBytes, formatDate } from "@/lib/utils";
import Link from "next/link";

function ExpiryLabel({ iso }: { iso: string }) {
  const days = daysUntil(iso);
  const soon = days <= 1;
  return (
    <span className={cn(soon && "font-medium text-warning")}>
      {days === 0 ? "Expires today" : `Expires in ${days} ${days === 1 ? "day" : "days"}`}
    </span>
  );
}

export function UploadsView() {
  const { data, loading, error, reload, setData } = useAsync(listUploads);
  const [toDelete, setToDelete] = useState<UserUpload | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function confirmDelete(u: UserUpload) {
    setBusy(true);
    setActionError(null);
    try {
      await deleteUpload(u.id);
      setData((prev) => prev.filter((x) => x.id !== u.id));
      setToDelete(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Uploads"
        description="Files you attached in chat. They are private to you."
        actions={
          <Button asChild variant="secondary">
            <Link href="/">Go to chat</Link>
          </Button>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-info-bg p-3 text-sm text-info">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Uploaded files are deleted automatically after {UPLOAD_RETENTION_DAYS} days.
          You can delete them earlier at any time.
        </p>
      </div>

      {loading && (
        <Card className="space-y-3 p-4" aria-busy="true" aria-label="Loading uploads">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </Card>
      )}

      {error && (
        <ErrorNotice
          title="Could not load your uploads"
          message={error}
          action={<Button variant="secondary" size="sm" onClick={reload}>Try again</Button>}
        />
      )}

      {actionError && (
        <div className="mb-4">
          <ErrorNotice title="Action failed" message={actionError} />
        </div>
      )}

      {data && (
        <Card className="overflow-hidden">
          {data.length === 0 ? (
            <EmptyState
              icon={FolderUp}
              title="No uploads yet"
              description="Attach a PDF, Word, PowerPoint, Excel, CSV or image file in the chat and it will show up here."
              action={
                <Button asChild>
                  <Link href="/">Open chat</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <caption className="sr-only">Your uploaded files</caption>
                <thead>
                  <tr className="border-b border-border bg-surface-muted text-left text-muted-foreground">
                    <th scope="col" className="px-4 py-2.5 font-medium">File</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Uploaded</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Expires</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileIcon kind={u.kind} />
                          <div className="min-w-0">
                            <p className="font-medium break-words">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{formatBytes(u.sizeBytes)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(u.uploadedAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><ExpiryLabel iso={u.expiresAt} /></td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger-bg"
                          onClick={() => setToDelete(u)}
                          aria-label={`Delete ${u.name}`}
                        >
                          <Trash2 /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <ConfirmDeleteDialog
        open={toDelete !== null}
        title="Delete this file?"
        description={toDelete ? `“${toDelete.name}” will be removed permanently.` : ""}
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && confirmDelete(toDelete)}
      />
    </PageContainer>
  );
}
