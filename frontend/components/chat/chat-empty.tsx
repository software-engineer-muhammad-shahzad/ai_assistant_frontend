import { ArrowUpRight, ShieldCheck } from "lucide-react";

/** Suggested questions shown in the empty chat (clicking one fills the input box). */
const EXAMPLE_QUESTIONS = [
  "What PPE is required for confined space entry?",
  "Summarize the fire safety policy",
  "Show last month's incidents by department",
  "What is the permit-to-work procedure for hot work?",
];

export function ChatEmpty({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <ShieldCheck className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        How can I help with safety today?
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask about policies and procedures, or about incident records. Every
        answer shows where it came from.
      </p>
      <ul className="mt-8 grid w-full gap-3 sm:grid-cols-2">
        {EXAMPLE_QUESTIONS.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPick(q)}
              className="group flex h-full w-full items-start justify-between gap-2 rounded-lg border border-border bg-surface p-4 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <span>{q}</span>
              <ArrowUpRight
                className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
