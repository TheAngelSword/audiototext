import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_B64 = 4_800_000;
const MAX_TRANSCRIPT_CHARS = 24_000;
const MAX_PODCAST_CHARS = 2_400;

function requireKey() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false as const, error: "AI is not available in this environment" };
  }
  return { ok: true as const, apiKey };
}

type ChatOk = { ok: true; text: string };
type ChatFail = { ok: false; error: string };

async function chat(apiKey: string, system: string, user: string, maxTokens = 1800): Promise<ChatOk | ChatFail> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.4,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    return { ok: false, error: `No se pudo consultar el modelo (${res.status}).` };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "El modelo no devolvió texto." };
  return { ok: true, text };
}

export const transcribeAudio = createServerFn({ method: "POST" })
  .validator(
    z.object({
      filename: z.string().min(1).max(180),
      mime: z.string().min(1).max(120),
      base64: z.string().min(16).max(MAX_B64),
      language: z.string().min(2).max(12).default("es"),
    }),
  )
  .handler(async ({ data }) => {
    const key = requireKey();
    if (!key.ok) return key;

    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.length < 200) {
      return { ok: false as const, error: "El audio está vacío o dañado." };
    }
    if (bytes.length > 3_500_000) {
      return {
        ok: false as const,
        error: "El archivo pesa demasiado para enviarlo. Graba en vivo o recorta el audio.",
      };
    }

    const form = new FormData();
    form.append("language", data.language);
    form.append("format", "true");
    form.append("diarize", "true");
    const file = new File([bytes], data.filename, { type: data.mime || "audio/webm" });
    form.append("file", file);

    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${key.apiKey}` },
      body: form,
    });
    if (!res.ok) {
      return {
        ok: false as const,
        error: `No se pudo transcribir el audio (${res.status}). Prueba otro formato o la grabación en vivo.`,
      };
    }
    const body = (await res.json()) as {
      text?: string;
      language?: string;
      duration?: number;
      words?: { text: string; start: number; end: number; speaker?: string }[];
    };
    const text = (body.text ?? "").trim();
    if (!text) {
      return { ok: false as const, error: "No se detectó voz en el audio." };
    }
    return {
      ok: true as const,
      text,
      language: body.language ?? data.language,
      duration: body.duration ?? 0,
      words: body.words ?? [],
    };
  });

const notesSchema = z.object({
  summary: z.string(),
  outline: z.array(z.string()),
  keyPoints: z.array(z.string()),
  questions: z.array(z.object({ q: z.string(), a: z.string() })),
  glossary: z.array(z.object({ term: z.string(), meaning: z.string() })),
});

export const buildClassNotes = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().max(160).optional(),
      subject: z.string().max(120).optional(),
      transcript: z.string().min(20).max(MAX_TRANSCRIPT_CHARS),
    }),
  )
  .handler(async ({ data }) => {
    const key = requireKey();
    if (!key.ok) return key;

    const system = `Eres un asistente de estudio para clases en español (neutro de México).
Devuelve SOLO JSON válido, sin markdown, con esta forma:
{"summary":"","outline":[""],"keyPoints":[""],"questions":[{"q":"","a":""}],"glossary":[{"term":"","meaning":""}]}
Reglas:
- summary: 3 a 5 oraciones claras.
- outline: 5 a 8 puntos del hilo de la clase.
- keyPoints: 4 a 7 ideas que sí entrarían en un examen.
- questions: 4 preguntas de repaso con respuesta breve.
- glossary: 3 a 6 términos de la clase.
No inventes contenido que no esté en la transcripción.`;

    const user = `Título: ${data.title || "Clase"}
Materia: ${data.subject || "Sin materia"}

Transcripción:
${data.transcript}`;

    const out = await chat(key.apiKey, system, user, 1600);
    if (!out.ok) return out;

    const raw = out.text.replace(/^```json\s*|\s*```$/g, "").trim();
    try {
      const parsed = notesSchema.parse(JSON.parse(raw));
      return { ok: true as const, notes: parsed };
    } catch {
      return {
        ok: false as const,
        error: "No se pudieron estructurar las notas. Inténtalo de nuevo.",
      };
    }
  });

export const buildPodcastScript = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().max(160).optional(),
      subject: z.string().max(120).optional(),
      transcript: z.string().min(20).max(MAX_TRANSCRIPT_CHARS),
    }),
  )
  .handler(async ({ data }) => {
    const key = requireKey();
    if (!key.ok) return key;

    const system = `Escribes guiones de mini-podcast educativo en español neutro de México.
Devuelve SOLO JSON: {"title":"","script":""}
El script es para UNA sola voz narradora (no diálogo teatral).
Longitud: 900 a 1600 caracteres. Cierra de forma natural.
Puedes usar [pause] y, con mesura, <soft>...</soft>.
No inventes datos que no estén en la clase. No uses emojis.`;

    const user = `Título de la clase: ${data.title || "Clase"}
Materia: ${data.subject || "Sin materia"}

Transcripción:
${data.transcript}`;

    const out = await chat(key.apiKey, system, user, 900);
    if (!out.ok) return out;
    const raw = out.text.replace(/^```json\s*|\s*```$/g, "").trim();
    try {
      const parsed = z
        .object({ title: z.string(), script: z.string() })
        .parse(JSON.parse(raw));
      const script = parsed.script.slice(0, MAX_PODCAST_CHARS);
      return {
        ok: true as const,
        title: parsed.title.slice(0, 120),
        script,
      };
    } catch {
      return { ok: false as const, error: "No se pudo escribir el guion. Inténtalo de nuevo." };
    }
  });

export const synthesizePodcast = createServerFn({ method: "POST" })
  .validator(
    z.object({
      script: z.string().min(40).max(MAX_PODCAST_CHARS),
      voiceId: z.enum(["eve", "ara", "rex"]).default("eve"),
    }),
  )
  .handler(async ({ data }) => {
    const key = requireKey();
    if (!key.ok) return key;

    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key.apiKey}`,
      },
      body: JSON.stringify({
        text: data.script,
        voice_id: data.voiceId,
        language: "es-MX",
        speed: 0.98,
        text_normalization: true,
        output_format: {
          codec: "mp3",
          sample_rate: 24000,
          bit_rate: 64000,
        },
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: `No se pudo narrar el podcast (${res.status}).` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) {
      return { ok: false as const, error: "La narración volvió vacía." };
    }
    return {
      ok: true as const,
      mime: "audio/mpeg",
      base64: buf.toString("base64"),
    };
  });
