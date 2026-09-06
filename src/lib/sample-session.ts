import type { ClassSession } from "./types";

export const SAMPLE_ID = "demo-fotosintesis";

export const SAMPLE_SESSION: ClassSession = {
  id: SAMPLE_ID,
  title: "Fotosíntesis y energía de las plantas",
  subject: "Biología · 3er semestre",
  createdAt: new Date().toISOString(),
  durationSec: 12 * 60 + 40,
  language: "es",
  sourceName: "clase-demo.m4a",
  sourceKind: "sample",
  transcript: `Profesora: Buenos días. Hoy vamos a cerrar el tema de fotosíntesis. Recuerden: las plantas no “comen tierra”. Transforman luz, agua y dióxido de carbono en azúcar y oxígeno.

Estudiante: Entonces el oxígeno que respiramos sale de las plantas, ¿verdad?

Profesora: En gran parte, sí. La ecuación resumida es: seis moléculas de CO2 más seis de agua, con luz, dan glucosa más seis de oxígeno. Eso ocurre en los cloroplastos, sobre todo en las hojas.

Hay dos fases. La fase luminosa ocurre en los tilacoides. Ahí la clorofila capta fotones, se parte el agua —fotólisis— y se generan ATP, NADPH y se libera O2. La fase oscura, o ciclo de Calvin, no necesita oscuridad: necesita los productos de la fase luminosa. En el estroma, la enzima Rubisco fija el CO2 y se arma glucosa.

Estudiante: ¿Por qué algunas plantas se marchitan si las riego de noche?

Profesora: El riego de noche no detiene la fotosíntesis. Lo que sí afecta es el exceso de agua en las raíces, que ahoga el intercambio de gases. La fotosíntesis se detiene sin luz, pero la respiración celular sigue. Por eso de noche la planta consume un poco del azúcar que guardó.

Para el examen les pido tres cosas: distinguir fase luminosa y Calvin, ubicar dónde ocurre cada una, y explicar por qué sin clorofila no hay captura de luz. Si les queda tiempo, comparen C3, C4 y CAM: son estrategias para no perder tanta agua en climas secos.

Cierren con esto: la fotosíntesis no es solo un tema de biología. Es el puente entre la energía del sol y casi toda la vida en la Tierra.`,
  words: [],
  notes: {
    summary:
      "La clase explica la fotosíntesis como conversión de luz, agua y CO2 en glucosa y oxígeno dentro de los cloroplastos. Se distinguen la fase luminosa (tilacoides: fotólisis, ATP, NADPH, O2) y el ciclo de Calvin (estroma: Rubisco fija CO2). Se aclara que de noche la planta respira y no fotosintetiza, y se anticipan las variantes C3, C4 y CAM.",
    outline: [
      "Idea central: las plantas transforman luz, agua y CO2 en azúcar y oxígeno",
      "Ecuación resumida y lugar: cloroplastos de la hoja",
      "Fase luminosa en tilacoides: clorofila, fotólisis del agua, ATP y NADPH",
      "Ciclo de Calvin en el estroma: Rubisco y síntesis de glucosa",
      "Noche: no hay fotosíntesis, sí respiración celular",
      "Para el examen: fases, ubicación y papel de la clorofila; mención C3/C4/CAM",
    ],
    keyPoints: [
      "Ecuación: 6 CO2 + 6 H2O + luz → C6H12O6 + 6 O2",
      "Fase luminosa: tilacoides; se libera oxígeno al partir el agua",
      "Fase oscura no implica oscuridad: usa ATP y NADPH",
      "Rubisco fija el dióxido de carbono",
      "Sin luz la planta deja de fotosintetizar pero sigue respirando",
    ],
    questions: [
      {
        q: "¿Dónde ocurre la fase luminosa y qué productos genera?",
        a: "En los tilacoides. Genera ATP, NADPH y oxígeno a partir de la fotólisis del agua.",
      },
      {
        q: "¿Por qué se dice que el ciclo de Calvin no necesita oscuridad?",
        a: "Porque no depende de la ausencia de luz, sino de ATP y NADPH producidos en la fase luminosa.",
      },
      {
        q: "¿Qué hace la enzima Rubisco?",
        a: "Fija el CO2 en el estroma para iniciar la síntesis de azúcares.",
      },
    ],
    glossary: [
      {
        term: "Cloroplasto",
        meaning: "Orgánulo de la célula vegetal donde ocurre la fotosíntesis.",
      },
      {
        term: "Fotólisis",
        meaning: "Ruptura de la molécula de agua impulsada por la luz.",
      },
      {
        term: "Rubisco",
        meaning: "Enzima que fija el dióxido de carbono en el ciclo de Calvin.",
      },
    ],
  },
  podcast: {
    title: "Mini clase: cómo las plantas fabrican azúcar con luz",
    script: `Hola. Esto es AulaVoz, el recuento de tu clase de hoy.

Hoy vimos fotosíntesis. No es que la planta coma tierra: toma luz, agua y dióxido de carbono, y fabrica glucosa. El oxígeno que soltamos al aire sale, en buena parte, de ese proceso.

Ocurre en los cloroplastos de la hoja. Hay dos actos. Primero, la fase luminosa, en los tilacoides: la clorofila atrapa fotones, se parte el agua y salen ATP, NADPH y oxígeno. [pause] Segundo, el ciclo de Calvin, en el estroma. Ahí la Rubisco fija el CO2 y se arma el azúcar. No hace falta que esté oscuro: hace falta lo que dejó la fase de luz.

De noche la planta no fotosintetiza, pero sí respira. Por eso gasta un poco de lo que guardó. Y si te preguntan en el examen, lleva esto claro: dónde ocurre cada fase, qué produce cada una, y por qué sin clorofila no hay captura de luz.

La fotosíntesis es el puente entre el sol y casi toda la vida en la Tierra. Hasta la próxima clase.`,
    voiceId: "eve",
    createdAt: new Date().toISOString(),
    durationSec: 95,
  },
  hasOriginalAudio: false,
  hasPodcastAudio: false,
};
