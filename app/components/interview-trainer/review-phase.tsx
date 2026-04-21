"use client";

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
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Review
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Replay every answer</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Every take stays in memory for this session so you can compare the
            original answer with each retake, and bookmarked takes stay saved on
            this device for later review.
          </p>
          {endedEarly ? (
            <p className="mt-4 text-sm leading-6 text-amber-200">
              The interview was ended early, so unanswered questions are marked
              as having no response.
            </p>
          ) : null}
          {bookmarkError ? (
            <p className="mt-4 text-sm leading-6 text-rose-300">
              {bookmarkError}
            </p>
          ) : null}
        </div>
        <button
          className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          onClick={onRestartInterview}
          type="button"
        >
          Restart interview
        </button>
      </div>

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
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm leading-6 text-slate-300">
          No takes have been recorded in this session yet. Start a new interview
          to create more answers, or review the bookmarked takes above.
        </div>
      )}
    </div>
  );
}
