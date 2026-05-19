import {
  type GenerateQuestionsRequest,
  generateInterviewQuestions,
  normalizeLocale,
} from "@/app/api/question-generation";
import PostHogClient from "@/services/analyticsService.server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateQuestionsRequest;
    const jobDescription =
      typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
    const locale = normalizeLocale(body.locale);

    const questions = await generateInterviewQuestions({
      jobDescription,
      locale,
    });
    PostHogClient().capture({ event: "questions_generated" });

    return NextResponse.json({
      questions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected question generation failure.",
      },
      { status: 500 },
    );
  }
}
