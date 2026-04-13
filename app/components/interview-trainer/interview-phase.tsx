"use client";

import type { RefObject } from "react";

import type { Phase } from "./types";

type InterviewPhaseProps = {
  countdown: number;
  currentQuestion: string;
  currentQuestionIndex: number;
  error: string;
  hasInterviewStarted: boolean;
  isLocked: boolean;
  isPaused: boolean;
  isPreparing: boolean;
  isRetaking: boolean;
  onDoneRecording: () => void;
  onPrimaryAction: () => void;
  phase: Phase;
  previewRef: RefObject<HTMLVideoElement | null>;
  recordingSeconds: number;
  recordingTimeLeft: number;
  startCountdownSeconds: number;
};

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function InterviewPhase({
  countdown,
  currentQuestion,
  currentQuestionIndex,
  error,
  hasInterviewStarted,
  isLocked,
  isPaused,
  isPreparing,
  isRetaking,
  onDoneRecording,
  onPrimaryAction,
  phase,
  previewRef,
  recordingSeconds,
  recordingTimeLeft,
  startCountdownSeconds,
}: InterviewPhaseProps) {
  return (
    <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-12">
        {isLocked ? (
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-cyan-400/20" />
        ) : null}

        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          {hasInterviewStarted
            ? isRetaking
              ? `Retaking Question ${currentQuestionIndex + 1}`
              : "Current prompt"
            : "Ready when you are"}
        </p>
        <div className="flex min-h-[320px] items-center justify-center">
          {hasInterviewStarted ? (
            <h2 className="max-w-3xl text-center text-3xl font-semibold leading-tight text-white md:text-5xl">
              {currentQuestion}
            </h2>
          ) : (
            <p className="max-w-2xl text-center text-lg leading-8 text-slate-300 md:text-xl">
              Start the interview to see each prompt one at a time, record your
              answer, and review every attempt afterward.
            </p>
          )}
        </div>

        <div className="flex items-center justify-center pt-6">
          {phase === "idle" ? (
            <button
              className="rounded-full bg-cyan-400 px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
              disabled={isPreparing}
              onClick={onPrimaryAction}
              type="button"
            >
              {isPreparing
                ? "Preparing camera..."
                : isRetaking
                  ? "Retry retake"
                  : "Start interview"}
            </button>
          ) : null}

          {phase === "countdown" ? (
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
                {isPaused ? "Interview paused" : "Recording starts in"}
              </p>
              <div className="mt-3 text-8xl font-semibold text-cyan-300">
                {countdown}
              </div>
              {isPaused ? (
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Take a moment to regroup, then resume when you are ready to
                  begin recording.
                </p>
              ) : null}
            </div>
          ) : null}

          {phase === "recording" ? (
            <div className="text-center">
              <p
                className={`text-sm uppercase tracking-[0.3em] ${
                  isPaused ? "text-amber-300" : "text-red-300"
                }`}
              >
                {isPaused ? "Recording paused" : "Recording live"}
              </p>
              <div className="mt-3 text-5xl font-semibold text-white">
                {formatSeconds(recordingTimeLeft)}
              </div>
              {isPaused ? (
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Notes time is off the clock until you resume.
                </p>
              ) : null}
              <button
                className="mt-6 rounded-full border border-cyan-400/40 bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                onClick={onDoneRecording}
                type="button"
              >
                Done
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="pt-6 text-center text-sm text-rose-300">{error}</p>
        ) : null}
      </div>

      <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900/90 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Camera
          </p>
          <h3 className="mt-2 text-2xl font-semibold">Live preview</h3>
        </div>

        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
          {phase === "countdown" || phase === "recording" ? (
            <>
              <video
                autoPlay
                className={`aspect-video w-full object-cover ${
                  phase === "countdown" ? "opacity-60 blur-[2px]" : ""
                }`}
                muted
                playsInline
                ref={previewRef}
              />
              {phase === "countdown" ? (
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm leading-6 text-slate-100">
                  {isPaused
                    ? "The countdown is paused while you collect your thoughts."
                    : "Camera is ready. Recording will begin automatically after the countdown."}
                </div>
              ) : null}
              {phase === "recording" && isPaused ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 px-6 text-center text-sm leading-6 text-slate-100">
                  Recording is paused. Resume when you are ready to continue.
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex aspect-video items-center justify-center px-6 text-center text-sm leading-6 text-slate-400">
              Start the interview to enable webcam and microphone recording.
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Countdown
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {startCountdownSeconds}s
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Answer time
            </p>
            <p className="mt-3 text-2xl font-semibold">{recordingSeconds}s</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
          The interface locks during the timed flow so you can focus on
          answering under pressure, but you can pause the live interview
          whenever you need a moment to regroup.
        </div>
      </aside>
    </div>
  );
}
