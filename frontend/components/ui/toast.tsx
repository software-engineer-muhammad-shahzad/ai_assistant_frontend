"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn, uid } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const STYLES: Record<ToastKind, { className: string; Icon: typeof Info }> = {
  success: { className: "border-success/40 bg-success-bg text-success", Icon: CheckCircle2 },
  error: { className: "border-danger/40 bg-danger-bg text-danger", Icon: AlertCircle },
  info: { className: "border-info/40 bg-info-bg text-info", Icon: Info },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = uid();
      setToasts((t) => [...t.slice(-4), { id, kind, message }]); // keep at most 5
      // Errors stay a little longer so they can be read.
      timers.current.set(id, setTimeout(() => dismiss(id), kind === "error" ? 8000 : 5000));
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map(({ id, kind, message }) => {
          const { className, Icon } = STYLES[kind];
          return (
            <div
              key={id}
              role={kind === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex items-start gap-2.5 rounded-lg border p-3 text-sm shadow-lg",
                className,
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 break-words">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="rounded p-0.5 hover:bg-black/10"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
