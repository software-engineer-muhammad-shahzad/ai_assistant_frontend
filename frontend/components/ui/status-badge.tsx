import { Archive, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import type { DocStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS: Record<
  DocStatus,
  { label: string; className: string; Icon: typeof Clock; spin?: boolean }
> = {
  ready: { label: "Ready", className: "bg-success-bg text-success", Icon: CheckCircle2 },
  processing: { label: "Processing", className: "bg-info-bg text-info", Icon: Loader2, spin: true },
  pending: { label: "Pending", className: "bg-warning-bg text-warning", Icon: Clock },
  failed: { label: "Failed", className: "bg-danger-bg text-danger", Icon: XCircle },
  archived: { label: "Archived", className: "bg-surface-muted text-muted-foreground", Icon: Archive },
};

/** Icon + text, so status is never conveyed by colour alone. */
export function StatusBadge({ status }: { status: DocStatus }) {
  const { label, className, Icon, spin } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <Icon className={cn("size-3.5", spin && "animate-spin")} aria-hidden="true" />
      {label}
    </span>
  );
}

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}
