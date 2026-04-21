"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { QuestionRecording, Recording, TranscriptState } from "./types";

type ReviewQuestionCardProps = {
  endedEarly: boolean;
  isLocked: boolean;
  isPreparing: boolean;
  isSavingRecordingId: string | null;
  latestRecordingId: string | null;
  onGenerateTranscript: (recording: Recording) => void;
  onStartRetake: (questionIndex: number) => void;
  onToggleBookmark: (input: {
    question: string;
    questionIndex: number;
    recording: Recording;
  }) => void;
  questionIndex: number;
  questionRecording: QuestionRecording;
  recordingSeconds: number;
  savedTakeIds: string[];
  transcripts: Record<string, TranscriptState>;
};

function BookmarkIcon({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V21l-5-3.2L7 21V4.75Z" />
    </svg>
  );
}

export function ReviewQuestionCard({
  endedEarly,
  isLocked,
  isPreparing,
  isSavingRecordingId,
  latestRecordingId,
  onGenerateTranscript,
  onStartRetake,
  onToggleBookmark,
  questionIndex,
  questionRecording,
  recordingSeconds,
  savedTakeIds,
  transcripts,
}: ReviewQuestionCardProps) {
  const t = useTranslations("ReviewQuestionCard");
  const latestAttemptIndex = questionRecording.recordings.length - 1;
  const hasNoResponse = questionRecording.recordings.length === 0;

  return (
    <Card className="border-border/80 bg-card/90 shadow-none backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">
            {t("questionBadge", { question: questionIndex + 1 })}
          </Badge>
          <CardTitle className="text-lg font-medium leading-snug">
            {questionRecording.question}
          </CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {t("limit", { seconds: recordingSeconds })}
          </Badge>
          <Button
            disabled={isPreparing || isLocked}
            onClick={() => onStartRetake(questionIndex)}
            size="sm"
            type="button"
          >
            {t("actions.addTake")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasNoResponse ? (
          <Alert>
            <AlertTitle>
              {endedEarly
                ? t("noResponse.endedEarlyTitle")
                : t("noResponse.title")}
            </AlertTitle>
            <AlertDescription>
              {endedEarly
                ? t("noResponse.endedEarlyDescription")
                : t("noResponse.description")}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4">
            {questionRecording.recordings.map((recording, attemptIndex) => {
              const isLatestAttempt = attemptIndex === latestAttemptIndex;
              const isSaved = savedTakeIds.includes(recording.id);
              const isSaving = isSavingRecordingId === recording.id;

              return (
                <Card
                  className={
                    isLatestAttempt
                      ? "border-primary/40 bg-primary/5 shadow-none"
                      : "bg-muted/30 shadow-none"
                  }
                  key={recording.id}
                  size="sm"
                >
                  <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {t("take", { number: attemptIndex + 1 })}
                        {attemptIndex === 0 ? ` ${t("originalSuffix")}` : ""}
                      </span>
                      {isLatestAttempt ? (
                        <Badge variant="secondary">{t("latest")}</Badge>
                      ) : null}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {new Date(recording.createdAt).toLocaleTimeString()}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        aria-pressed={isSaved}
                        disabled={isSaving}
                        onClick={() =>
                          onToggleBookmark({
                            question: questionRecording.question,
                            questionIndex,
                            recording,
                          })
                        }
                        size="sm"
                        type="button"
                        variant={isSaved ? "secondary" : "outline"}
                      >
                        <BookmarkIcon className="size-4" filled={isSaved} />
                        {isSaving
                          ? t("bookmark.saving")
                          : isSaved
                            ? t("bookmark.saved")
                            : t("bookmark.default")}
                      </Button>
                      <Button
                        disabled={
                          transcripts[recording.id]?.status === "loading"
                        }
                        onClick={() => onGenerateTranscript(recording)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {transcripts[recording.id]?.status === "loading"
                          ? t("transcript.generating")
                          : transcripts[recording.id]?.status === "ready"
                            ? t("transcript.regenerate")
                            : t("transcript.default")}
                      </Button>
                    </div>
                    {/* biome-ignore lint/a11y/useMediaCaption: Local interview recordings do not have generated captions in this prototype. */}
                    <video
                      autoPlay={recording.id === latestRecordingId}
                      className="w-full rounded-lg border border-border bg-black"
                      controls
                      playsInline
                      preload="metadata"
                      src={recording.videoUrl}
                    />
                    {transcripts[recording.id]?.status === "ready" ? (
                      <div className="bg-muted/40 space-y-2 rounded-lg border border-border/80 p-3">
                        <p className="text-primary text-xs tracking-wide uppercase">
                          {t("transcript.label")}
                        </p>
                        <p className="text-sm leading-relaxed">
                          {transcripts[recording.id]?.text}
                        </p>
                      </div>
                    ) : null}
                    {transcripts[recording.id]?.status === "error" ? (
                      <Alert variant="destructive">
                        <AlertTitle>{t("transcript.label")}</AlertTitle>
                        <AlertDescription>
                          {transcripts[recording.id]?.error}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
