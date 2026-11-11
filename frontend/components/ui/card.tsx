import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-muted", className)}
      {...props}
    />
  );
}
