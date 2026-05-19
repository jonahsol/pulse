import PostHogClient from "@/services/analyticsService.server";
import { OpenAIWhisperAudio } from "@langchain/community/document_loaders/fs/openai_whisper_audio";
import { NextResponse } from "next/server";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const FALLBACK_EXTENSION = ".webm";
const SUPPORTED_EXTENSIONS = new Set([
  ".flac",
  ".m4a",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".oga",
  ".ogg",
  ".wav",
  ".webm",
]);

export const runtime = "nodejs";

function getTranscriptFileExtension(file: File) {
  const fileNameExtension = extname(file.name).toLowerCase();

  if (SUPPORTED_EXTENSIONS.has(fileNameExtension)) {
    return fileNameExtension;
  }

  if (file.type.includes("mp4")) {
    return ".mp4";
  }

  if (file.type.includes("mpeg")) {
    return ".mpeg";
  }

  if (file.type.includes("ogg")) {
    return ".ogg";
  }

  if (file.type.includes("wav")) {
    return ".wav";
  }

  if (file.type.includes("m4a")) {
    return ".m4a";
  }

  if (file.type.includes("mp3")) {
    return ".mp3";
  }

  return FALLBACK_EXTENSION;
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "Set OPENAI_API_KEY before requesting transcripts from Whisper.",
      },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Upload a recording file to generate a transcript.",
        },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "The uploaded recording is empty.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Recordings must be under 25MB for Whisper transcription.",
        },
        { status: 400 },
      );
    }

    const fileExtension = getTranscriptFileExtension(file);
    const tempFilePath = join(
      tmpdir(),
      `interview-transcript-${crypto.randomUUID()}${fileExtension}`,
    );

    try {
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      await writeFile(tempFilePath, fileBuffer);

      const loader = new OpenAIWhisperAudio(tempFilePath, {
        clientOptions: {
          apiKey: process.env.OPENAI_API_KEY,
        },
        transcriptionCreateParams: {
          language: "en",
        },
      });
      const documents = await loader.load();
      const transcript = documents
        .map((document) => document.pageContent.trim())
        .filter(Boolean)
        .join("\n\n");

      if (!transcript) {
        return NextResponse.json(
          {
            error: "Whisper returned an empty transcript.",
          },
          { status: 502 },
        );
      }

      PostHogClient().capture({ event: "transcript_generated" });

      return NextResponse.json({
        transcript,
      });
    } finally {
      await unlink(tempFilePath).catch(() => undefined);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected transcription failure.",
      },
      { status: 500 },
    );
  }
}
