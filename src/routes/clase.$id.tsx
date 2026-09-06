import { useEffect, useMemo, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Headphones,
  LoaderCircle,
  NotebookPen,
  Pause,
  Play,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  buildClassNotes,
  buildPodcastScript,
  synthesizePodcast,
} from "@/lib/ai/classroom";
import { getAudio, putAudio } from "@/lib/idb";
import { useLibrary } from "@/lib/store";
import type { ClassSession } from "@/lib/types";
import { base64ToBlob, downloadBlob, downloadText, formatDuration } from "@/lib/utils";

export const Route = createFileRoute("/clase/$id")({ component: ClassPage });

type Tab = "texto" | "notas" | "podcast";

function ClassPage() {
  const { id } = Route.useParams();
  const load = useLibrary((s) => s.load);
  const ready = useLibrary((s) => s.ready);
  const session = useLibrary((s) => s.sessions.find((x) => x.id === id));
  const patch = useLibrary((s) => s.patch);
  const setNotes = useLibrary((s) => s.setNotes);
  const setPodcast = useLibrary((s) => s.setPodcast);

  const [tab, setTab] = useState<Tab>("texto");
  const [busy, setBusy] = useState<"notes" | "script" | "voice" | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!ready) void load();
  }, [ready, load]);

  useEffect(() => {
    if (!session) return;
    setDraftTitle(session.title);
    setDraftSubject(session.subject);
  }, [session?.id]);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    (async () => {
      if (!session?.hasPodcastAudio) {
        setAudioUrl(null);
        return;
      }
      const blob = await getAudio(session.id, "podcast");
      if (cancelled || !blob) return;
      const url = URL.createObjectURL(blob);
      revoked = url;
      setAudioUrl(url);
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [session?.id, session?.hasPodcastAudio]);

  const speakers = useMemo(() => groupBySpeaker(session), [session]);

  if (ready && !session) {
    return (
      <AppShell>
        <p className="text-sm text-muted">No encontramos esa clase.</p>
        <Link to="/" className="mt-3 inline-block text-sm text-accent">
          Volver
        </Link>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
      </AppShell>
    );
  }

  const current = session;

  async function saveMeta() {
    await patch(current.id, {
      title: draftTitle.trim() || current.title,
      subject: draftSubject.trim(),
    });
    toast.success("Datos actualizados");
  }

  async function makeNotes() {
    setBusy("notes");
    try {
      const result = await buildClassNotes({
        data: {
          title: current.title,
          subject: current.subject,
          transcript: current.transcript.slice(0, 24000),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await setNotes(current.id, result.notes);
      setTab("notas");
    } catch {
      toast.error("No se pudieron generar las notas.");
    } finally {
      setBusy(null);
    }
  }

  async function makePodcast() {
    setBusy("script");
    try {
      let script = current.podcast?.script ?? "";
      let title = current.podcast?.title ?? "";
      if (!script) {
        const drafted = await buildPodcastScript({
          data: {
            title: current.title,
            subject: current.subject,
            transcript: current.transcript.slice(0, 24000),
          },
        });
        if (!drafted.ok) {
          toast.error(drafted.error);
          return;
        }
        script = drafted.script;
        title = drafted.title;
        await setPodcast(
          current.id,
          {
            title,
            script,
            voiceId: "eve",
            createdAt: new Date().toISOString(),
          },
          false,
        );
      }
      setTab("podcast");
      setBusy("voice");
      const spoken = await synthesizePodcast({
        data: { script, voiceId: "eve" },
      });
      if (!spoken.ok) {
        toast.error(spoken.error);
        return;
      }
      const blob = base64ToBlob(spoken.base64, spoken.mime);
      await putAudio(current.id, "podcast", blob);
      await setPodcast(
        current.id,
        {
          title: title || "Podcast de la clase",
          script,
          voiceId: "eve",
          createdAt: new Date().toISOString(),
        },
        true,
      );
    } catch {
      toast.error("No se pudo crear el podcast.");
    } finally {
      setBusy(null);
    }
  }

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Biblioteca
      </Link>

      <header className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Título</span>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={() => void saveMeta()}
              className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Materia</span>
            <input
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
              onBlur={() => void saveMeta()}
              className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-subtle">
          {session.sourceName} · {formatDuration(session.durationSec)}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={() => void makeNotes()} disabled={!!busy}>
            {busy === "notes" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <NotebookPen className="size-4" />
            )}
            {session.notes ? "Regenerar notas" : "Hacer notas de estudio"}
          </Button>
          <Button onClick={() => void makePodcast()} disabled={!!busy}>
            {busy === "script" || busy === "voice" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Headphones className="size-4" />
            )}
            {busy === "script"
              ? "Escribiendo guion…"
              : busy === "voice"
                ? "Narrando…"
                : session.hasPodcastAudio
                  ? "Volver a narrar"
                  : "Crear podcast"}
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              downloadText(
                `${slug(session.title)}.txt`,
                formatExport(session),
              )
            }
          >
            <Download className="size-4" />
            Descargar texto
          </Button>
        </div>
      </header>

      <div className="mt-5 flex gap-1 rounded-lg bg-surface-2 p-1">
        {(
          [
            ["texto", "Transcripción"],
            ["notas", "Notas"],
            ["podcast", "Podcast"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`min-h-11 flex-1 rounded-md px-3 text-sm font-medium transition-colors duration-(--motion-quick) ${
              tab === key ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mt-4 rounded-xl border border-border bg-surface p-5 sm:p-6">
        {tab === "texto" ? (
          speakers.length > 1 ? (
            <div className="space-y-4">
              {speakers.map((block, i) => (
                <article key={i}>
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    {block.speaker}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                    {block.text}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{session.transcript}</p>
          )
        ) : null}

        {tab === "notas" ? (
          session.notes ? (
            <NotesView notes={session.notes} />
          ) : (
            <EmptyHint
              title="Aún no hay notas"
              body="A partir de la transcripción se arma un resumen, un esquema y preguntas de repaso."
            />
          )
        ) : null}

        {tab === "podcast" ? (
          session.podcast ? (
            <div>
              <h3 className="font-display text-xl font-medium tracking-tight">
                {session.podcast.title}
              </h3>
              {audioUrl ? (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-pine-soft/80 px-3 py-3">
                  <Button className="size-11 px-0" onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproducir"}>
                    {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </Button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Escuchar el recuento</p>
                    <p className="text-xs text-muted">Voz {session.podcast.voiceId}</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      const blob = await getAudio(session.id, "podcast");
                      if (blob) downloadBlob(`${slug(session.title)}.mp3`, blob);
                    }}
                  >
                    <Download className="size-4" />
                  </Button>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setPlaying(false)}
                    onPause={() => setPlaying(false)}
                    onPlay={() => setPlaying(true)}
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  El guion ya está listo. Pulsa «Crear podcast» para narrarlo.
                </p>
              )}
              <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                {session.podcast.script}
              </p>
            </div>
          ) : (
            <EmptyHint
              title="Todavía no hay podcast"
              body="Se escribe un guion breve con lo esencial de la clase y se narra en voz alta."
            />
          )
        ) : null}
      </section>
    </AppShell>
  );
}

function EmptyHint({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}

function NotesView({ notes }: { notes: NonNullable<ClassSession["notes"]> }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-accent">Resumen</h3>
        <p className="mt-2 text-sm leading-relaxed">{notes.summary}</p>
      </section>
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-accent">Esquema</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed">
          {notes.outline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-accent">Para el examen</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          {notes.keyPoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-accent">Preguntas</h3>
        <dl className="mt-2 space-y-3">
          {notes.questions.map((qa) => (
            <div key={qa.q}>
              <dt className="text-sm font-medium">{qa.q}</dt>
              <dd className="mt-0.5 text-sm text-muted">{qa.a}</dd>
            </div>
          ))}
        </dl>
      </section>
      {notes.glossary.length > 0 ? (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-accent">Glosario</h3>
          <dl className="mt-2 space-y-2">
            {notes.glossary.map((g) => (
              <div key={g.term}>
                <dt className="text-sm font-medium">{g.term}</dt>
                <dd className="text-sm text-muted">{g.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

function groupBySpeaker(session: ClassSession | undefined) {
  if (!session) return [];
  const words = session.words ?? [];
  if (!words.some((w) => w.speaker)) {
    return session.transcript ? [{ speaker: "Clase", text: session.transcript }] : [];
  }
  const blocks: { speaker: string; text: string }[] = [];
  for (const w of words) {
    const speaker = w.speaker || "Voz";
    const last = blocks[blocks.length - 1];
    if (!last || last.speaker !== speaker) blocks.push({ speaker, text: w.text });
    else last.text += (w.text.match(/^[,.;:!?]/) ? "" : " ") + w.text;
  }
  return blocks;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "clase";
}

function formatExport(session: ClassSession) {
  const parts = [
    session.title,
    session.subject,
    "",
    session.transcript,
  ];
  if (session.notes) {
    parts.push("", "RESUMEN", session.notes.summary, "", "ESQUEMA");
    parts.push(...session.notes.outline.map((x, i) => `${i + 1}. ${x}`));
    parts.push("", "PREGUNTAS");
    for (const qa of session.notes.questions) {
      parts.push(`P: ${qa.q}`, `R: ${qa.a}`, "");
    }
  }
  if (session.podcast) {
    parts.push("", "GUION DEL PODCAST", session.podcast.title, "", session.podcast.script);
  }
  return parts.join("\n");
}
