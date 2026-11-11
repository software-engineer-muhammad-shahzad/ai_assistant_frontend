"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/** Shared by Knowledge Base and My Uploads. */
export function ConfirmDeleteDialog({
  open,
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
