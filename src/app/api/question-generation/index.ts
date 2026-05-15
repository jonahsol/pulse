import { ChatOpenAI } from "@langchain/openai";
import { routing } from "@/i18n/routing";

const QUESTION_COUNT = 10;

export type Locale = (typeof routing.locales)[number];

export type GenerateQuestionsRequest = {
  jobDescription?: unknown;
  locale?: unknown;
};

const LANGUAGE_BY_LOCALE: Record<Locale, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
};

const fallbackQuestionsByLocale: Record<Locale, string[]> = {
  en: [
    "Tell me about a difficult technical tradeoff you made.",
    "Describe a time you disagreed with product or design.",
    "How do you prioritize technical debt against feature work?",
    "Why are you interested in this role?",
    "Tell me about a production issue you handled.",
    "Describe a project where you had to work through ambiguity.",
    "How do you decide when a solution is good enough to ship?",
    "Tell me about a time you improved a process or system.",
    "How do you communicate risk to non-technical stakeholders?",
    "What kind of work tends to bring out your best performance?",
  ],
  es: [
    "Cuéntame sobre una decisión técnica difícil que hayas tomado.",
    "Describe una vez en la que no estuviste de acuerdo con producto o diseño.",
    "¿Cómo priorizas la deuda técnica frente al trabajo de nuevas funcionalidades?",
    "¿Por qué te interesa este puesto?",
    "Cuéntame sobre un incidente en producción que hayas gestionado.",
    "Describe un proyecto en el que tuviste que avanzar con ambigüedad.",
    "¿Cómo decides cuándo una solución está lista para lanzarse?",
    "Cuéntame sobre una vez en la que mejoraste un proceso o sistema.",
    "¿Cómo comunicas riesgos a personas no técnicas?",
    "¿Qué tipo de trabajo suele sacar lo mejor de ti?",
  ],
  pt: [
    "Conte sobre uma decisão técnica difícil que você tomou.",
    "Descreva uma vez em que você discordou de produto ou design.",
    "Como você prioriza dívida técnica em relação a novas funcionalidades?",
    "Por que você tem interesse nesta vaga?",
    "Conte sobre um incidente em produção que você resolveu.",
    "Descreva um projeto em que você precisou lidar com ambiguidade.",
    "Como você decide quando uma solução está pronta para ir ao ar?",
    "Conte sobre uma vez em que você melhorou um processo ou sistema.",
    "Como você comunica riscos a stakeholders não técnicos?",
    "Que tipo de trabalho costuma trazer o seu melhor desempenho?",
  ],
  fr: [
    "Parlez-moi d'un compromis technique difficile que vous avez fait.",
    "Décrivez une fois où vous n'étiez pas d'accord avec le produit ou le design.",
    "Comment priorisez-vous la dette technique par rapport aux nouvelles fonctionnalités ?",
    "Pourquoi ce poste vous intéresse-t-il ?",
    "Parlez-moi d'un incident en production que vous avez géré.",
    "Décrivez un projet où vous avez dû avancer dans l'ambiguïté.",
    "Comment décidez-vous qu'une solution est prête à être livrée ?",
    "Parlez-moi d'une fois où vous avez amélioré un processus ou un système.",
    "Comment communiquez-vous les risques aux parties prenantes non techniques ?",
    "Quel type de travail fait ressortir votre meilleure performance ?",
  ],
  de: [
    "Erzähl mir von einem schwierigen technischen Trade-off, den du getroffen hast.",
    "Beschreibe eine Situation, in der du mit Produkt oder Design nicht einverstanden warst.",
    "Wie priorisierst du technische Schulden gegenüber neuen Features?",
    "Warum interessierst du dich für diese Rolle?",
    "Erzähl mir von einem Produktionsvorfall, den du bearbeitet hast.",
    "Beschreibe ein Projekt, bei dem du mit Unklarheit arbeiten musstest.",
    "Wie entscheidest du, wann eine Lösung gut genug zum Ausliefern ist?",
    "Erzähl mir von einer Situation, in der du einen Prozess oder ein System verbessert hast.",
    "Wie kommunizierst du Risiken an nicht-technische Stakeholder?",
    "Welche Art von Arbeit bringt bei dir die beste Leistung hervor?",
  ],
};

const roleContextByLocale: Record<
  Locale,
  { frontend: string; backend: string; leadership: string; default: string }
> = {
  en: {
    frontend: "frontend product engineering",
    backend: "backend engineering",
    leadership: "technical leadership",
    default: "software engineering",
  },
  es: {
    frontend: "ingeniería frontend de producto",
    backend: "ingeniería backend",
    leadership: "liderazgo técnico",
    default: "ingeniería de software",
  },
  pt: {
    frontend: "engenharia frontend de produto",
    backend: "engenharia backend",
    leadership: "liderança técnica",
    default: "engenharia de software",
  },
  fr: {
    frontend: "ingénierie frontend produit",
    backend: "ingénierie backend",
    leadership: "leadership technique",
    default: "ingénierie logicielle",
  },
  de: {
    frontend: "Frontend-Produktentwicklung",
    backend: "Backend-Entwicklung",
    leadership: "technische Führung",
    default: "Softwareentwicklung",
  },
};

const roleInterestQuestionByLocale: Record<Locale, (roleContext: string) => string> =
  {
    en: (roleContext) => `Why are you interested in this ${roleContext} role?`,
    es: (roleContext) => `¿Por qué te interesa este puesto de ${roleContext}?`,
    pt: (roleContext) => `Por que você tem interesse nesta vaga de ${roleContext}?`,
    fr: (roleContext) =>
      `Pourquoi ce poste de ${roleContext} vous intéresse-t-il ?`,
    de: (roleContext) =>
      `Warum interessierst du dich für diese Rolle im Bereich ${roleContext}?`,
  };

export function normalizeLocale(locale: unknown): Locale {
  if (
    typeof locale === "string" &&
    routing.locales.includes(locale as Locale)
  ) {
    return locale as Locale;
  }

  return routing.defaultLocale;
}

function getRoleContext(jobDescription: string, locale: Locale) {
  const lowerJobDescription = jobDescription.toLowerCase();
  const contexts = roleContextByLocale[locale];

  if (
    lowerJobDescription.includes("frontend") ||
    lowerJobDescription.includes("react") ||
    lowerJobDescription.includes("ui")
  ) {
    return contexts.frontend;
  }

  if (
    lowerJobDescription.includes("backend") ||
    lowerJobDescription.includes("api") ||
    lowerJobDescription.includes("infrastructure")
  ) {
    return contexts.backend;
  }

  if (
    lowerJobDescription.includes("manager") ||
    lowerJobDescription.includes("lead")
  ) {
    return contexts.leadership;
  }

  return contexts.default;
}

function getFallbackQuestions(jobDescription: string, locale: Locale) {
  const roleContext = getRoleContext(jobDescription, locale);

  return fallbackQuestionsByLocale[locale].map((question, index) =>
    index === 3 ? roleInterestQuestionByLocale[locale](roleContext) : question,
  );
}

function parseQuestions(content: unknown) {
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((part) =>
              typeof part === "object" && part && "text" in part
                ? String(part.text)
                : "",
            )
            .join("\n")
        : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((question): question is string => typeof question === "string")
      .map((question) => question.trim())
      .filter(Boolean)
      .slice(0, 12);
  } catch {
    return [];
  }
}

async function generateQuestionsWithOpenAI({
  jobDescription,
  locale,
}: {
  jobDescription: string;
  locale: Locale;
}) {
  if (!process.env.OPENAI_API_KEY) {
    return undefined;
  }

  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4.1-mini",
    temperature: 0.6,
  });

  const language = LANGUAGE_BY_LOCALE[locale];
  const response = await model.invoke([
    [
      "system",
      [
        "You generate concise interview practice questions.",
        "Return only a JSON array of strings.",
        `Generate ${QUESTION_COUNT} realistic, role-specific questions in ${language}.`,
        "Avoid assistant branding, explanations, markdown, and categories.",
      ].join(" "),
    ],
    [
      "human",
      `Job description:\n${jobDescription || "General software engineering role"}`,
    ],
  ]);

  const questions = parseQuestions(response.content);
  return questions.length >= 8 ? questions : undefined;
}

export async function generateInterviewQuestions({
  jobDescription,
  locale,
}: {
  jobDescription: string;
  locale: Locale;
}) {
  await new Promise((resolve) => setTimeout(resolve, 650));

  return (
    (await generateQuestionsWithOpenAI({ jobDescription, locale })) ??
    getFallbackQuestions(jobDescription, locale)
  );
}
