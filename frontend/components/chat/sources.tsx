"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";

/** "Sources" chips under an answer. Click a chip to show the quoted passage. */
export function Sources({ sources, messageId }: { sources: Source[]; messageId: string }) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section aria-label="Sources" className="mt-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Sources
      </h3>
      <ul className="flex flex-wrap gap-2">
        {sources.map((s) => {
          const isOpen = open.has(s.id);
          const panelId = `${messageId}-${s.id}-quote`;
          return (
            <li key={s.id} className={cn(isOpen && "w-full")}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={cn(
                  "inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-surface-muted",
                  isOpen && "w-full bg-surface-muted",
                )}
              >
                <FileText className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate font-medium">{s.file}</span>
                {s.page !== null && (
                  <span className="shrink-0 text-muted-foreground">p. {s.page}</span>
                )}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "ml-auto size-3.5 shrink-0 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <blockquote
                  id={panelId}
                  className="mt-1.5 rounded-md border-l-4 border-primary bg-surface-muted px-3 py-2 text-sm leading-relaxed"
                >
                  “{s.quote}”
                </blockquote>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
