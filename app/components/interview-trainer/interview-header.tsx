"use client";

type InterviewHeaderProps = {
  canEndEarly: boolean;
  canTogglePause: boolean;
  currentQuestionIndex: number;
  isPaused: boolean;
  isRetaking: boolean;
  onEndEarly: () => void;
  onTogglePause: () => void;
  questionCount: number;
};

export function InterviewHeader({
  canEndEarly,
  canTogglePause,
  currentQuestionIndex,
  isPaused,
  isRetaking,
  onEndEarly,
  onTogglePause,
  questionCount,
}: InterviewHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
        {isRetaking
          ? `Retake for Question ${currentQuestionIndex + 1}`
          : `Question ${Math.min(currentQuestionIndex + 1, questionCount)} of ${questionCount}`}
      </div>
      {canTogglePause ? (
        <button
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
          onClick={onTogglePause}
          type="button"
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
      ) : null}
      {canEndEarly ? (
        <button
          className="rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-400/20"
          onClick={onEndEarly}
          type="button"
        >
          End Early
        </button>
      ) : null}
    </div>
  );
}
