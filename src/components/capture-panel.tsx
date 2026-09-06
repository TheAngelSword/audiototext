import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Mic, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transcribeAudio } from "@/lib/ai/classroom";
import { putAudio } from "@/lib/idb";
import { useLibrary } from "@/lib/store";
import { ACCEPTED_AUDIO, MAX_AUDIO_BYTES, type ClassSession } from "@/lib/types";
import { blobToBase64, formatBytes, uid } from "@/lib/utils";

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { resultIndex: number; results: SpeechResultList }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechResultList = ArrayLike<{
  isFinal: boolean;
  0: { transcript: string };
}>;

function speechCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

async function audioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : 0);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.src = url;
  });
}

export function CapturePanel() {
  const navigate = useNavigate();
  const upsert = useLibrary((s) => s.upsert);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recRef = useRef<SpeechRec | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [recording, setRecording] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [interim, setInterim] = useState("");
  const [busy, setBusy] = useState<"idle" | "upload" | "finalize">("idle");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const t = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 400);
    return () => window.clearInterval(t);
  }, [recording]);

  useEffect(() => {
    return () => {
      recRef.current?.stop();
      mediaRef.current?.state === "recording" && mediaRef.current.stop();
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  async function saveSession(partial: Omit<ClassSession, "id" | "createdAt"> & { audio?: Blob }) {
    const id = uid();
    const session: ClassSession = {
      id,
      createdAt: new Date().toISOString(),
      title: partial.title,
      subject: partial.subject,
      durationSec: partial.durationSec,
      language: partial.language,
      sourceName: partial.sourceName,
      sourceKind: partial.sourceKind,
      transcript: partial.transcript,
      words: partial.words,
      notes: null,
      podcast: null,
      hasOriginalAudio: Boolean(partial.audio),
      hasPodcastAudio: false,
    };
    if (partial.audio) await putAudio(id, "original", partial.audio);
    await upsert(session);
    void navigate({ to: "/clase/$id", params: { id } });
  }

  async function startRecording() {
    const Ctor = speechCtor();
    if (!Ctor && !navigator.mediaDevices?.getUserMedia) {
      toast.error("Este navegador no permite grabar ni dictar.");
      return;
    }
    setLiveText("");
    setInterim("");
    setElapsed(0);
    startedAt.current = Date.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 24000 });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.start(1000);
      mediaRef.current = rec;
    } catch {
      toast.error("No se pudo abrir el micrófono. Revisa el permiso.");
      return;
    }

    if (Ctor) {
      const rec = new Ctor();
      rec.lang = "es-MX";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (ev) => {
        let finals = "";
        let mid = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const piece = ev.results[i][0].transcript;
          if (ev.results[i].isFinal) finals += piece + " ";
          else mid += piece;
        }
        if (finals) setLiveText((prev) => (prev + finals).replace(/\s+/g, " "));
        setInterim(mid);
      };
      rec.onerror = () => {
        /* keep MediaRecorder running */
      };
      rec.onend = () => {
        if (mediaRef.current?.state === "recording") {
          try {
            rec.start();
          } catch {
            /* already stopped */
          }
        }
      };
      recRef.current = rec;
      try {
        rec.start();
      } catch {
        /* ignore */
      }
    }

    setRecording(true);
  }

  async function stopRecording() {
    setRecording(false);
    setBusy("finalize");
    recRef.current?.stop();
    recRef.current = null;
    const media = mediaRef.current;
    mediaRef.current = null;
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((tr) => tr.stop());

    const blob = await new Promise<Blob | null>((resolve) => {
      if (!media || media.state === "inactive") {
        resolve(
          chunksRef.current.length
            ? new Blob(chunksRef.current, { type: media?.mimeType || "audio/webm" })
            : null,
        );
        return;
      }
      media.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: media.mimeType || "audio/webm" }));
      };
      media.stop();
    });

    const spoken = (liveText + " " + interim).replace(/\s+/g, " ").trim();
    const duration = blob ? await audioDuration(blob) : elapsed;

    if (spoken.length >= 12) {
      await saveSession({
        title: title.trim() || "Clase grabada",
        subject: subject.trim(),
        durationSec: duration || elapsed,
        language: "es",
        sourceName: "grabación en vivo",
        sourceKind: "record",
        transcript: spoken,
        words: [],
        notes: null,
        podcast: null,
        hasOriginalAudio: Boolean(blob),
        hasPodcastAudio: false,
        audio: blob && blob.size > 200 ? blob : undefined,
      });
      setBusy("idle");
      setLiveText("");
      setInterim("");
      return;
    }

    if (blob && blob.size > 400) {
      if (blob.size > MAX_AUDIO_BYTES) {
        toast.error("La grabación es larga. Se guardó el texto disponible; recorta el audio para transcribirlo con IA.");
        await saveSession({
          title: title.trim() || "Clase grabada",
          subject: subject.trim(),
          durationSec: duration || elapsed,
          language: "es",
          sourceName: "grabación en vivo",
          sourceKind: "record",
          transcript: spoken || "(Sin texto detectado. Sube un recorte más corto para transcribir.)",
          words: [],
          notes: null,
          podcast: null,
          hasOriginalAudio: true,
          hasPodcastAudio: false,
          audio: blob,
        });
        setBusy("idle");
        return;
      }
      try {
        const base64 = await blobToBase64(blob);
        const result = await transcribeAudio({
          data: {
            filename: "grabacion.webm",
            mime: blob.type || "audio/webm",
            base64,
            language: "es",
          },
        });
        if (!result.ok) {
          toast.error(result.error);
          setBusy("idle");
          return;
        }
        await saveSession({
          title: title.trim() || "Clase grabada",
          subject: subject.trim(),
          durationSec: result.duration || duration || elapsed,
          language: result.language,
          sourceName: "grabación en vivo",
          sourceKind: "record",
          transcript: result.text,
          words: result.words,
          notes: null,
          podcast: null,
          hasOriginalAudio: true,
          hasPodcastAudio: false,
          audio: blob,
        });
      } catch {
        toast.error("No se pudo enviar la grabación.");
      }
      setBusy("idle");
      return;
    }

    toast.error("No se captó audio ni texto. Inténtalo de nuevo.");
    setBusy("idle");
  }

  async function onFile(file: File) {
    if (file.size > MAX_AUDIO_BYTES) {
      toast.error(
        `El archivo pesa ${formatBytes(file.size)}. Recórtalo a menos de ${formatBytes(MAX_AUDIO_BYTES)} o graba en vivo.`,
      );
      return;
    }
    setBusy("upload");
    try {
      const base64 = await blobToBase64(file);
      const result = await transcribeAudio({
        data: {
          filename: file.name || "clase.mp3",
          mime: file.type || "audio/mpeg",
          base64,
          language: "es",
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        setBusy("idle");
        return;
      }
      const duration = result.duration || (await audioDuration(file));
      await saveSession({
        title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
        subject: subject.trim(),
        durationSec: duration,
        language: result.language,
        sourceName: file.name,
        sourceKind: "upload",
        transcript: result.text,
        words: result.words,
        notes: null,
        podcast: null,
        hasOriginalAudio: true,
        hasPodcastAudio: false,
        audio: file,
      });
    } catch {
      toast.error("No se pudo leer el archivo.");
    }
    setBusy("idle");
  }

  const working = busy !== "idle";

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_0_rgba(26,23,20,0.04)] sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight">Nueva clase</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Graba con el micrófono o sube el audio. Sale la transcripción y, si quieres, un
            podcast para repasarla.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Fotosíntesis, sesión 4"
            className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Materia</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ej. Biología"
            className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {!recording ? (
          <Button onClick={startRecording} disabled={working} className="sm:min-w-48">
            <Mic className="size-4" />
            Grabar clase
          </Button>
        ) : (
          <Button variant="danger" onClick={stopRecording}>
            <Square className="size-3.5 fill-current" />
            Detener · {elapsed}s
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={working || recording}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" />
          {busy === "upload" ? "Transcribiendo…" : "Subir audio"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_AUDIO}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onFile(file);
          }}
        />
      </div>

      {recording ? (
        <div className="mt-5 rounded-lg bg-pine-soft/70 px-4 py-3">
          <div className="waveform" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} style={{ height: `${18 + ((i * 13) % 28)}px` }} />
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-fg">
            {liveText || interim ? (
              <>
                {liveText} <span className="text-muted">{interim}</span>
              </>
            ) : (
              <span className="text-muted">Escuchando… habla cerca del micrófono.</span>
            )}
          </p>
        </div>
      ) : null}

      {busy === "finalize" || busy === "upload" ? (
        <p className="mt-4 text-sm text-muted">
          {busy === "upload"
            ? "Pasando el audio a texto. Esto puede tardar un momento."
            : "Guardando la clase…"}
        </p>
      ) : (
        <p className="mt-4 text-xs text-subtle">
          Archivos hasta {formatBytes(MAX_AUDIO_BYTES)}. La grabación en vivo no tiene ese
          tope: el texto se arma mientras hablas.
        </p>
      )}
    </section>
  );
}
