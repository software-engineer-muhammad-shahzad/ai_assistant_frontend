"use client";

import { Activity, Bot, CheckCircle2, Database, RefreshCw, Server, XCircle } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { API_URL, getApiHealth, getDbHealth, getOllamaHealth } from "@/lib/api";
import { cn } from "@/lib/utils";

type Detail = { label: string; value: string | number };

function ServiceCard<T>({
  title,
  icon: Icon,
  endpoint,
  state,
  details,
}: {
  title: string;
  icon: typeof Server;
  endpoint: string;
  state: { data: T | null; loading: boolean; error: string | null };
  details: (data: T) => Detail[];
}) {
  const { data, loading, error } = state;
  const ok = !loading && !error && data !== null;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">
              <code>GET {endpoint}</code>
            </p>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-6 w-24 rounded-full" />
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
            )}
          >
            {ok ? (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            ) : (
              <XCircle className="size-3.5" aria-hidden="true" />
            )}
            {ok ? "Online" : "Problem"}
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4 text-sm" aria-live="polite">
        {loading && (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {error && <p className="text-danger">{error}</p>}
        {ok && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            {details(data as T).map((d) => (
              <div key={d.label} className="contents">
                <dt className="text-muted-foreground">{d.label}</dt>
                <dd className="font-medium">{d.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Card>
  );
}

export function StatusView() {
  const api = useAsync(getApiHealth);
  const db = useAsync(getDbHealth);
  const ollama = useAsync(getOllamaHealth);

  const anyLoading = api.loading || db.loading || ollama.loading;
  // API unreachable = no HTTP status in the message path; treat a failed /health as "backend not running".
  const backendDown = !api.loading && api.error !== null;

  function recheck() {
    api.reload();
    db.reload();
    ollama.reload();
  }

  return (
    <PageContainer>
      <PageHeader
        title="System Status"
        description="Live health of the services behind the assistant."
        actions={
          <Button variant="secondary" onClick={recheck} disabled={anyLoading}>
            <RefreshCw className={cn(anyLoading && "animate-spin")} /> Re-check
          </Button>
        }
      />

      {backendDown && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-danger/30 bg-danger-bg p-4 text-sm text-danger"
        >
          <p className="font-semibold">The backend is not running</p>
          <p className="mt-1">
            The app could not reach <code>{API_URL}</code>. Start the API server
            and press Re-check. From the project folder, run:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-background/60 p-2 text-xs text-foreground">
            uvicorn backend.main:app --reload --port 8000
          </pre>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ServiceCard
          title="API"
          icon={Server}
          endpoint="/health"
          state={api}
          details={(d) => [{ label: "Status", value: d.status }]}
        />
        <ServiceCard
          title="Oracle database"
          icon={Database}
          endpoint="/health/db"
          state={db}
          details={(d) => [
            { label: "Connection", value: d.oracle },
            { label: "Documents", value: d.documents.toLocaleString() },
            { label: "Chunks", value: d.chunks.toLocaleString() },
          ]}
        />
        <ServiceCard
          title="Ollama / AI models"
          icon={Bot}
          endpoint="/health/ollama"
          state={ollama}
          details={(d) => [
            { label: "Connection", value: d.ollama },
            { label: "Embedding model", value: d.embed_model },
            { label: "Embedding size", value: d.embedding_size },
          ]}
        />
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="size-3.5" aria-hidden="true" />
        Status, Knowledge Base and Chat answers use the real backend. Chat history and My Uploads are not connected yet.
      </p>
    </PageContainer>
  );
}
