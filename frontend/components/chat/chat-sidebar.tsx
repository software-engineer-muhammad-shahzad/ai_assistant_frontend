import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import type { Chat } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";

export function ChatSidebar({
  chats,
  loading,
  activeId,
  onNew,
  onSelect,
}: {
  chats: Chat[] | null;
  loading: boolean;
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button onClick={onNew} className="w-full">
          <Plus /> New chat
        </Button>
      </div>
      <nav aria-label="Previous chats" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <h2 className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Previous chats
        </h2>
        {loading && (
          <div className="space-y-2 px-1" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        )}
        {!loading && chats?.length === 0 && (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No chats yet. Ask your first question.
          </p>
        )}
        <ul className="space-y-1">
          {chats?.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={c.id === activeId ? "true" : undefined}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                  c.id === activeId
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-surface-muted",
                )}
              >
                <MessageSquare className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{c.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatRelative(c.updatedAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
