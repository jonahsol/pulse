import { ChatOpenAI } from "@langchain/openai";

const QUESTION_COUNT = 10;

type Locale = "en" | "es";

export type GenerateQuestionsRequest = {
  jobDescription?: unknown;
  locale?: unknown;
};

const fallbackQuestionsByLocale = {
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
};

export function normalizeLocale(locale: unknown): Locale {
  return locale === "es" ? "es" : "en";
}

function getRoleContext(jobDescription: string, locale: Locale) {
  const lowerJobDescription = jobDescription.toLowerCase();

  if (
    lowerJobDescription.includes("frontend") ||
    lowerJobDescription.includes("react") ||
    lowerJobDescription.includes("ui")
  ) {
    return locale === "es"
      ? "ingeniería frontend de producto"
      : "frontend product engineering";
  }

  if (
    lowerJobDescription.includes("backend") ||
    lowerJobDescription.includes("api") ||
    lowerJobDescription.includes("infrastructure")
  ) {
    return locale === "es" ? "ingeniería backend" : "backend engineering";
  }

  if (
    lowerJobDescription.includes("manager") ||
    lowerJobDescription.includes("lead")
  ) {
    return locale === "es" ? "liderazgo técnico" : "technical leadership";
  }

  return locale === "es" ? "ingeniería de software" : "software engineering";
}

function getFallbackQuestions(jobDescription: string, locale: Locale) {
  const roleContext = getRoleContext(jobDescription, locale);

  if (locale === "es") {
    return fallbackQuestionsByLocale.es.map((question, index) =>
      index === 3
        ? `¿Por qué te interesa este puesto de ${roleContext}?`
        : question,
    );
  }

  return fallbackQuestionsByLocale.en.map((question, index) =>
    index === 3
      ? `Why are you interested in this ${roleContext} role?`
      : question,
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

  const language = locale === "es" ? "Spanish" : "English";
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
