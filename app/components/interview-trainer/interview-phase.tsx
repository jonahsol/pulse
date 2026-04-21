"use client";

import type { RefObject } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { Phase } from "./types";

type InterviewPhaseProps = {
  canEndEarly: boolean;
  canTogglePause: boolean;
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
  onEndEarly: () => void;
  onPrimaryAction: () => void;
  onTogglePause: () => void;
  onViewSavedTakes: () => void;
  phase: Phase;
  previewRef: RefObject<HTMLVideoElement | null>;
  questionCount: number;
  recordingElapsedSeconds: number;
  recordingSeconds: number;
  savedTakeCount: number;
  startCountdownSeconds: number;
};

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function InterviewPhase({
  canEndEarly,
  canTogglePause,
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
  onEndEarly,
  onPrimaryAction,
  onTogglePause,
  onViewSavedTakes,
  phase,
  previewRef,
  questionCount,
  recordingElapsedSeconds,
  recordingSeconds,
  savedTakeCount,
  startCountdownSeconds,
}: InterviewPhaseProps) {
  const showSessionTools = canTogglePause;
  const questionHeading =
    hasInterviewStarted && !isRetaking
      ? `Question ${Math.min(currentQuestionIndex + 1, questionCount)} of ${questionCount}`
      : isRetaking
        ? `Retake · Question ${currentQuestionIndex + 1}`
        : null;

  return (
    <Card className="relative w-full border-border/80 bg-card/80 shadow-none backdrop-blur-sm transition-opacity duration-300">
      {isLocked ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] rounded-xl ring-1 ring-primary/25 ring-inset"
        />
      ) : null}
      <CardHeader className="gap-4 space-y-0 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="font-normal tracking-wide" variant="secondary">
              {isRetaking ? "Retake" : hasInterviewStarted ? "Live" : "Ready"}
            </Badge>
            {questionHeading ? (
              <span className="text-muted-foreground text-xs">
                {questionHeading}
              </span>
            ) : null}
          </div>
          {showSessionTools ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={onTogglePause}
                size="sm"
                type="button"
                variant="outline"
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
              {canEndEarly ? (
                <Button
                  onClick={onEndEarly}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  End early
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <Separator />

        <div
          className={`transition-all duration-300 ${
            phase === "recording" ? "text-center" : "text-center md:px-2"
          }`}
        >
          {hasInterviewStarted ? (
            <h2
              className={`font-semibold leading-tight tracking-tight transition-all duration-300 ${
                phase === "recording"
                  ? "text-foreground/90 text-lg md:text-xl"
                  : "text-3xl md:text-4xl"
              }`}
            >
              {currentQuestion}
            </h2>
          ) : (
            <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
              One prompt at a time, timed recording, then review. Start when you
              are ready.
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="flex min-h-[200px] flex-col items-center justify-center transition-opacity duration-300">
          {phase === "idle" ? (
            <Button
              className="rounded-full px-8 py-6 text-base"
              disabled={isPreparing}
              onClick={onPrimaryAction}
              size="lg"
              type="button"
            >
              {isPreparing
                ? "Preparing camera…"
                : isRetaking
                  ? "Retry retake"
                  : "Start"}
            </Button>
          ) : null}

          {phase === "countdown" ? (
            <div className="text-center">
              <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                {isPaused ? "Paused" : "Starting in"}
              </p>
              <div className="text-primary mt-2 text-7xl font-semibold tabular-nums md:text-8xl">
                {countdown}
              </div>
              {isPaused ? (
                <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
                  Resume when you are ready to continue the countdown.
                </p>
              ) : null}
            </div>
          ) : null}

          {phase === "recording" ? (
            <div className="flex w-full flex-col items-center gap-6 text-center">
              <div className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className={`size-2 shrink-0 rounded-full bg-destructive ${
                    isPaused ? "opacity-40" : "animate-pulse"
                  }`}
                />
                <span
                  className={
                    isPaused
                      ? "text-muted-foreground"
                      : "text-destructive font-medium"
                  }
                >
                  {isPaused ? "Recording paused" : "Recording"}
                </span>
              </div>
              <div className="text-5xl font-semibold tabular-nums tracking-tight md:text-6xl">
                {formatSeconds(recordingElapsedSeconds)}
              </div>
              <p className="text-muted-foreground text-xs">
                Stops automatically at {formatSeconds(recordingSeconds)}
              </p>
              {isPaused ? (
                <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                  Timer is paused until you resume.
                </p>
              ) : null}
              <Button
                className="rounded-full"
                onClick={onDoneRecording}
                type="button"
                variant="default"
              >
                Done
              </Button>
            </div>
          ) : null}
        </div>

        <div
          className={`relative overflow-hidden rounded-2xl border border-border bg-black transition-opacity duration-300 ${
            phase === "countdown" ? "opacity-90" : "opacity-100"
          }`}
        >
          {phase === "countdown" || phase === "recording" ? (
            <>
              <video
                autoPlay
                className={`aspect-video w-full object-cover transition-all duration-300 ${
                  phase === "countdown" ? "scale-[1.02] blur-[1px]" : ""
                }`}
                muted
                playsInline
                ref={previewRef}
              />
              {phase === "countdown" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20 px-6 text-center text-sm leading-relaxed text-foreground">
                  {isPaused
                    ? "Countdown is paused."
                    : "Recording begins automatically after the countdown."}
                </div>
              ) : null}
              {phase === "recording" && isPaused ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/35 px-6 text-center text-sm leading-relaxed">
                  Recording is paused. Resume to continue.
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-muted-foreground flex aspect-video items-center justify-center px-6 text-center text-sm leading-relaxed">
              Camera preview appears when you start.
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-6 pt-2">
        <div className="grid w-full grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/40 rounded-xl border border-border/60 px-4 py-3">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Countdown
            </p>
            <p className="mt-1 font-semibold tabular-nums">
              {startCountdownSeconds}s
            </p>
          </div>
          <div className="bg-muted/40 rounded-xl border border-border/60 px-4 py-3">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Answer limit
            </p>
            <p className="mt-1 font-semibold tabular-nums">
              {recordingSeconds}s
            </p>
          </div>
        </div>

        {phase === "idle" && savedTakeCount > 0 ? (
          <div className="bg-primary/10 w-full rounded-xl border border-primary/25 p-4">
            <p className="text-primary text-xs tracking-wide uppercase">
              Saved takes
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {savedTakeCount} bookmarked{" "}
              {savedTakeCount === 1 ? "take" : "takes"} on this device.
            </p>
            <Button
              className="mt-3"
              onClick={onViewSavedTakes}
              type="button"
              variant="outline"
            >
              Review saved takes
            </Button>
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to continue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardFooter>
    </Card>
  );
}
