"use client";

import { ReviewQuestionCard } from "./review-question-card";
import type { QuestionRecording, Recording, TranscriptState } from "./types";

type ReviewPhaseProps = {
  endedEarly: boolean;
  isLocked: boolean;
  isPreparing: boolean;
  latestRecordingId: string | null;
  onGenerateTranscript: (recording: Recording) => void;
  onRestartInterview: () => void;
  onStartRetake: (questionIndex: number) => void;
  recordings: QuestionRecording[];
  recordingSeconds: number;
  transcripts: Record<string, TranscriptState>;
};

export function ReviewPhase({
  endedEarly,
  isLocked,
  isPreparing,
  latestRecordingId,
  onGenerateTranscript,
  onRestartInterview,
  onStartRetake,
  recordings,
  recordingSeconds,
  transcripts,
}: ReviewPhaseProps) {
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
            original answer with each retake.
          </p>
          {endedEarly ? (
            <p className="mt-4 text-sm leading-6 text-amber-200">
              The interview was ended early, so unanswered questions are marked
              as having no response.
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

      {recordings.map((questionRecording, index) => (
        <ReviewQuestionCard
          endedEarly={endedEarly}
          isLocked={isLocked}
          isPreparing={isPreparing}
          key={questionRecording.question}
          latestRecordingId={latestRecordingId}
          onGenerateTranscript={onGenerateTranscript}
          onStartRetake={onStartRetake}
          questionIndex={index}
          questionRecording={questionRecording}
          recordingSeconds={recordingSeconds}
          transcripts={transcripts}
        />
      ))}
    </div>
  );
}
