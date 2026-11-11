import { AlertCircle, Paperclip, ShieldCheck } from "lucide-react";
import type { Message } from "@/lib/types";
import { DataResultView } from "./data-result";
import { Markdown } from "./markdown";
import { Sources } from "./sources";

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">
          <p className="whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed">
            {message.content}
          </p>
          {message.attachments && message.attachments.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {message.attachments.map((name) => (
                <li
                  key={name}
                  className="inline-flex items-center gap-1 rounded bg-black/15 px-2 py-0.5 text-xs"
                >
                  <Paperclip className="size-3" aria-hidden="true" />
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (message.error) {
    // A problem (backend not running, model error): shown as a clear notice, not as an answer.
    return (
      <div
        role="alert"
        className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger-bg p-3 text-sm text-danger"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 break-words">{message.content}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
        aria-hidden="true"
      >
        <ShieldCheck className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="sr-only">Assistant says:</p>
        <Markdown>{message.content}</Markdown>
        {message.data && <DataResultView result={message.data} />}
        {message.sources && message.sources.length > 0 && (
          <Sources sources={message.sources} messageId={message.id} />
        )}
      </div>
    </div>
  );
}

export function ThinkingBubble() {
  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <div
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
        aria-hidden="true"
      >
        <ShieldCheck className="size-4" />
      </div>
      <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
        <span>Thinking</span>
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-muted-foreground"
              style={{
                animation: "thinking-dot 1.2s infinite ease-in-out",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </span>
        <span className="sr-only">The assistant is preparing an answer</span>
      </div>
    </div>
  );
}
