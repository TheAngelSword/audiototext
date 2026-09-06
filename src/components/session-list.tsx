import { Link } from "@tanstack/react-router";
import { Clock, FileAudio, Mic, Trash2 } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { formatDate, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SessionList() {
  const { ready, sessions, remove } = useLibrary();

  if (!ready) {
    return (
      <div className="grid gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-2" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
        Aún no hay clases. Graba o sube la primera.
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {sessions.map((s) => (
        <li key={s.id}>
          <div className="flex min-w-0 items-stretch gap-1 overflow-hidden rounded-lg border border-border bg-surface p-3 sm:gap-2 sm:p-4">
            <Link
              to="/clase/$id"
              params={{ id: s.id }}
              className="min-w-0 flex-1 overflow-hidden no-underline text-fg"
            >
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {s.subject || "Sin materia"} · {s.sourceName}
                  </p>
                </div>
                <span className="w-fit shrink-0 rounded-full bg-pine-soft px-2.5 py-1 text-xs text-accent">
                  {s.podcast ? "Con podcast" : s.notes ? "Con notas" : "Texto listo"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
                <span className="inline-flex items-center gap-1">
                  {s.sourceKind === "record" ? (
                    <Mic className="size-3.5" />
                  ) : (
                    <FileAudio className="size-3.5" />
                  )}
                  {formatDate(s.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock className="size-3.5" />
                  {formatDuration(s.durationSec)}
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              className="mt-1 size-11 shrink-0 px-0"
              aria-label="Eliminar clase"
              onClick={() => void remove(s.id)}
            >
              <Trash2 className="size-4 text-muted" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
