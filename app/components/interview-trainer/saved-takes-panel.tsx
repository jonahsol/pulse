"use client";

import type { Recording, SavedTake, TranscriptState } from "./types";

type SavedTakesPanelProps = {
  onGenerateTranscript: (recording: Recording) => void;
  onRemoveBookmark: (savedTakeId: string) => void;
  savedTakes: SavedTake[];
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

export function SavedTakesPanel({
  onGenerateTranscript,
  onRemoveBookmark,
  savedTakes,
  transcripts,
}: SavedTakesPanelProps) {
  if (savedTakes.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5 rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Saved takes
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Bookmarked for later review
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Saved takes stay in local browser storage on this device, so you can
            come back and review them across sessions.
          </p>
        </div>
        <span className="rounded-full border border-cyan-400/30 px-4 py-2 text-sm text-cyan-100">
          {savedTakes.length} saved {savedTakes.length === 1 ? "take" : "takes"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {savedTakes.map((savedTake) => (
          <article
            className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
            key={savedTake.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                  Question {savedTake.questionIndex + 1}
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {savedTake.question}
                </p>
              </div>
              <button
                aria-label="Remove bookmark"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-200 hover:text-white"
                onClick={() => onRemoveBookmark(savedTake.id)}
                type="button"
              >
                <BookmarkIcon className="h-4 w-4" filled />
                Saved
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Recorded {new Date(savedTake.createdAt).toLocaleString()}
            </p>

            {/* biome-ignore lint/a11y/useMediaCaption: Saved interview recordings do not have generated captions in this prototype. */}
            <video
              className="w-full rounded-2xl border border-white/10 bg-black"
              controls
              playsInline
              preload="metadata"
              src={savedTake.videoUrl}
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
                disabled={transcripts[savedTake.id]?.status === "loading"}
                onClick={() => onGenerateTranscript(savedTake)}
                type="button"
              >
                {transcripts[savedTake.id]?.status === "loading"
                  ? "Generating transcript..."
                  : transcripts[savedTake.id]?.status === "ready"
                    ? "Regenerate transcript"
                    : "Transcript"}
              </button>
              <p className="text-xs text-slate-400">
                Saved {new Date(savedTake.savedAt).toLocaleString()}
              </p>
            </div>

            {transcripts[savedTake.id]?.status === "ready" ? (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                  Transcript
                </p>
                <p className="text-sm leading-6 text-slate-200">
                  {transcripts[savedTake.id]?.text}
                </p>
              </div>
            ) : null}

            {transcripts[savedTake.id]?.status === "error" ? (
              <p className="text-sm text-rose-300">
                {transcripts[savedTake.id]?.error}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
