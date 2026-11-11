import { Database } from "lucide-react";
import { Badge } from "@/components/ui/status-badge";
import type { DataResult } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Database-style answer: a clean table plus a percentage breakdown. */
export function DataResultView({ result }: { result: DataResult }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{result.title}</h3>
        <Badge>
          <Database className="size-3" aria-hidden="true" />
          Records · {result.recordCount}
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{result.title}</caption>
          <thead>
            <tr className="bg-surface-muted text-left">
              {result.columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "px-4 py-2 font-medium text-muted-foreground",
                    c.align === "right" && "text-right",
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                {result.columns.map((c, ci) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-2",
                      c.align === "right" && "text-right tabular-nums",
                      ci === 0 && "font-medium",
                    )}
                  >
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-4 py-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {result.breakdownLabel}
        </h4>
        <ul className="space-y-2.5">
          {result.breakdown.map((b) => (
            <li key={b.label} className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr_3.5rem]">
              <span className="truncate" title={b.label}>
                {b.label}
              </span>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-surface-muted"
                role="img"
                aria-label={`${b.label}: ${b.percent}%`}
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${b.percent}%` }}
                />
              </div>
              <span className="text-right tabular-nums text-muted-foreground">
                {b.percent.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
