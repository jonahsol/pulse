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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { ReviewQuestionCard } from "./review-question-card";
import { SavedTakesPanel } from "./saved-takes-panel";
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
  savedTakes,
  transcripts,
}: ReviewPhaseProps) {
  const hasCurrentSessionTakes = recordings.some(
    (questionRecording) => questionRecording.recordings.length > 0,
  );

  return (
    <ScrollArea className="h-[min(100vh-7rem,56rem)] pr-3 md:h-[min(100vh-8rem,60rem)]">
      <div className="space-y-6 pb-8">
        <Card className="border-border/80 bg-card/80 shadow-none backdrop-blur-sm">
          <CardHeader className="gap-2">
            <CardTitle>Review</CardTitle>
            <CardDescription>
              Session takes stay in memory until you start a new session.
              Bookmarked takes remain on this device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {endedEarly ? (
              <Alert>
                <AlertTitle>Ended early</AlertTitle>
                <AlertDescription>
                  Unanswered questions are marked as having no response.
                </AlertDescription>
              </Alert>
            ) : null}
            {bookmarkError ? (
              <Alert variant="destructive">
                <AlertTitle>Bookmarks</AlertTitle>
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
              Start new interview
            </Button>
          </CardContent>
        </Card>

        <SavedTakesPanel
          onGenerateTranscript={onGenerateTranscript}
          onRemoveBookmark={onRemoveBookmark}
          savedTakes={savedTakes}
          transcripts={transcripts}
        />

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
              <p>
                No takes in this session yet. Start a new interview from the
                header, or open saved takes above.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
