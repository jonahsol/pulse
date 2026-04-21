"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

import { ReviewQuestionCard } from "./review-question-card";
import type {
  QuestionRecording,
  Recording,
  SavedTake,
  TranscriptState,
} from "./types";

type ReviewPhaseProps = {
  bookmarkError: string;
  endedEarly: boolean;
  isLocked: boolean;
  isPreparing: boolean;
  isSavingRecordingId: string | null;
  latestRecordingId: string | null;
  onGenerateTranscript: (recording: Recording) => void;
  onRemoveBookmark: (savedTakeId: string) => void;
  onRestartInterview: () => void;
  onStartRetake: (questionIndex: number) => void;
  onToggleBookmark: (input: {
    question: string;
    questionIndex: number;
    recording: Recording;
  }) => void;
  recordings: QuestionRecording[];
  recordingSeconds: number;
  savedTakes: SavedTake[];
  transcripts: Record<string, TranscriptState>;
};

export function ReviewPhase({
  bookmarkError,
  endedEarly,
  isLocked,
  isPreparing,
  isSavingRecordingId,
  latestRecordingId,
  onGenerateTranscript,
  onRemoveBookmark,
  onRestartInterview,
  onStartRetake,
  onToggleBookmark,
  recordings,
  recordingSeconds,
  transcripts,
  savedTakes,
}: ReviewPhaseProps) {
  const t = useTranslations("ReviewPhase");
  const hasCurrentSessionTakes = recordings.some(
    (questionRecording) => questionRecording.recordings.length > 0,
  );

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-border/80 bg-card/80 shadow-none backdrop-blur-sm">
        <CardHeader className="gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {endedEarly ? (
            <Alert>
              <AlertTitle>{t("endedEarly.title")}</AlertTitle>
              <AlertDescription>{t("endedEarly.description")}</AlertDescription>
            </Alert>
          ) : null}
          {bookmarkError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("bookmarks.title")}</AlertTitle>
              <AlertDescription>{bookmarkError}</AlertDescription>
            </Alert>
          ) : null}
          <Separator />
          <Button
            className="w-full rounded-full sm:w-auto"
            disabled={isPreparing}
            onClick={() => {
              void onRestartInterview();
            }}
            type="button"
          >
            {t("actions.startNewInterview")}
          </Button>
        </CardContent>
      </Card>

      {hasCurrentSessionTakes || endedEarly ? (
        recordings.map((questionRecording, index) => (
          <ReviewQuestionCard
            endedEarly={endedEarly}
            isLocked={isLocked}
            isPreparing={isPreparing}
            isSavingRecordingId={isSavingRecordingId}
            key={questionRecording.question}
            latestRecordingId={latestRecordingId}
            onGenerateTranscript={onGenerateTranscript}
            onStartRetake={onStartRetake}
            onToggleBookmark={onToggleBookmark}
            questionIndex={index}
            questionRecording={questionRecording}
            recordingSeconds={recordingSeconds}
            savedTakeIds={savedTakes.map((savedTake) => savedTake.id)}
            transcripts={transcripts}
          />
        ))
      ) : (
        <Card className="border-dashed border-border/80 bg-muted/20 shadow-none">
          <CardContent className="text-muted-foreground space-y-4 py-8 text-sm leading-relaxed">
            <p>{t("emptyState")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
