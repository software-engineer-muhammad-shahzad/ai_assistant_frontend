import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorNotice({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/30 bg-danger-bg p-4 text-sm text-danger"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
