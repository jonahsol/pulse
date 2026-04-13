"use client";

import type { QuestionRecording, Recording, TranscriptState } from "./types";

type ReviewQuestionCardProps = {
  endedEarly: boolean;
  isLocked: boolean;
  isPreparing: boolean;
  latestRecordingId: string | null;
  onGenerateTranscript: (recording: Recording) => void;
  onStartRetake: (questionIndex: number) => void;
  questionIndex: number;
  questionRecording: QuestionRecording;
  recordingSeconds: number;
  transcripts: Record<string, TranscriptState>;
};

export function ReviewQuestionCard({
  endedEarly,
  isLocked,
  isPreparing,
  latestRecordingId,
  onGenerateTranscript,
  onStartRetake,
  questionIndex,
  questionRecording,
  recordingSeconds,
  transcripts,
}: ReviewQuestionCardProps) {
  const latestAttemptIndex = questionRecording.recordings.length - 1;
  const hasNoResponse = questionRecording.recordings.length === 0;

  return (
    <article className="space-y-5 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
          Question {questionIndex + 1}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
            {recordingSeconds}s limit
          </span>
          <button
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            disabled={isPreparing || isLocked}
            onClick={() => onStartRetake(questionIndex)}
            type="button"
          >
            Add Take
          </button>
        </div>
      </div>

      <h3 className="text-xl font-medium leading-8 text-white">
        {questionRecording.question}
      </h3>

      {hasNoResponse && endedEarly ? (
        <div className="rounded-2xl border border-dashed border-amber-300/40 bg-amber-300/10 p-5">
          <p className="text-sm font-medium text-amber-100">
            No response recorded
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The interview was ended early before this question was answered.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {questionRecording.recordings.map((recording, attemptIndex) => {
            const isLatestAttempt = attemptIndex === latestAttemptIndex;

            return (
              <div
                className={`space-y-3 rounded-2xl border p-4 ${
                  isLatestAttempt
                    ? "border-cyan-400/50 bg-cyan-400/5"
                    : "border-white/10 bg-white/5"
                }`}
                key={recording.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">
                    Take {attemptIndex + 1}
                    {attemptIndex === 0 ? " (Original)" : ""}
                  </p>
                  {isLatestAttempt ? (
                    <span className="rounded-full border border-cyan-400/40 px-3 py-1 text-xs text-cyan-300">
                      Latest
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(recording.createdAt).toLocaleTimeString()}
                </p>
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
                  disabled={transcripts[recording.id]?.status === "loading"}
                  onClick={() => onGenerateTranscript(recording)}
                  type="button"
                >
                  {transcripts[recording.id]?.status === "loading"
                    ? "Generating transcript..."
                    : transcripts[recording.id]?.status === "ready"
                      ? "Regenerate transcript"
                      : "Transcript"}
                </button>
                {/* biome-ignore lint/a11y/useMediaCaption: Local interview recordings do not have generated captions in this prototype. */}
                <video
                  autoPlay={recording.id === latestRecordingId}
                  className="w-full rounded-2xl border border-white/10 bg-black"
                  controls
                  playsInline
                  preload="metadata"
                  src={recording.videoUrl}
                />
                {transcripts[recording.id]?.status === "ready" ? (
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                      Transcript
                    </p>
                    <p className="text-sm leading-6 text-slate-200">
                      {transcripts[recording.id]?.text}
                    </p>
                  </div>
                ) : null}
                {transcripts[recording.id]?.status === "error" ? (
                  <p className="text-sm text-rose-300">
                    {transcripts[recording.id]?.error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
