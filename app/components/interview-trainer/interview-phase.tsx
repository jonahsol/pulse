"use client";

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
import { cn } from "@/lib/utils";
import {
  IconCheck,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { RefObject } from "react";
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
  phase: Phase;
  previewRef: RefObject<HTMLVideoElement | null>;
  questionCount: number;
  recordingElapsedSeconds: number;
  recordingSeconds: number;
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
  phase,
  previewRef,
  questionCount,
  recordingElapsedSeconds,
  recordingSeconds,
  startCountdownSeconds,
}: InterviewPhaseProps) {
  const t = useTranslations("InterviewPhase");
  const showSessionTools = canTogglePause;
  const questionHeading =
    hasInterviewStarted && !isRetaking
      ? t("questionHeading.standard", {
          current: Math.min(currentQuestionIndex + 1, questionCount),
          total: questionCount,
        })
      : isRetaking
        ? t("questionHeading.retake", {
            current: currentQuestionIndex + 1,
          })
        : null;

  return (
    <Card className="gap-5 relative w-full border-border/80 bg-card/80 shadow-none backdrop-blur-sm transition-opacity duration-300">
      {isLocked && <InterviewLocked />}
      {hasInterviewStarted && (
        <CardHeader className="gap-4 space-y-0 px-0">
          <InterviewHeader
            isRetaking={isRetaking}
            hasInterviewStarted={hasInterviewStarted}
            questionHeading={questionHeading}
            showSessionTools={showSessionTools}
            onTogglePause={onTogglePause}
            canEndEarly={canEndEarly}
            isPaused={isPaused}
            onEndEarly={onEndEarly}
          />
          <Separator />
        </CardHeader>
      )}

      <CardContent className="flex flex-col gap-6">
        {phase === "idle" && (
          <PreInterviewSection
            onStart={onPrimaryAction}
            isPreparing={isPreparing}
            isRetaking={isRetaking}
          />
        )}

        {hasInterviewStarted && (
          <div className="flex flex-col justify-center gap-6 h-60">
            <InterviewQuestion question={currentQuestion} phase={phase} />
            {phase === "recording" && (
              <RecordingTimer
                isPaused={isPaused}
                recordingElapsedSeconds={recordingElapsedSeconds}
                recordingSeconds={recordingSeconds}
                onDoneRecording={onDoneRecording}
              />
            )}
            {phase === "countdown" && (
              <Countdown countdown={countdown} isPaused={isPaused} />
            )}
          </div>
        )}

        <InterviewVideoPlayer
          phase={phase}
          previewRef={previewRef}
          isPaused={isPaused}
        />
      </CardContent>

      {(phase === "idle" || error) && (
        <CardFooter>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>{t("errors.title")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {phase === "idle" && (
            <InterviewConfigForm
              startCountdownSeconds={startCountdownSeconds}
              recordingSeconds={recordingSeconds}
            />
          )}
        </CardFooter>
      )}
    </Card>
  );
}

function InterviewConfigForm({
  startCountdownSeconds,
  recordingSeconds,
}: {
  startCountdownSeconds: number;
  recordingSeconds: number;
}) {
  const t = useTranslations("InterviewPhase");
  return (
    <div className="grid w-full grid-cols-2 gap-3 text-sm">
      <div className="bg-muted/40 rounded-xl border border-border/60 px-4 py-3">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {t("metrics.countdown")}
        </p>
        <p className="mt-1 font-semibold tabular-nums">
          {startCountdownSeconds}s
        </p>
      </div>
      <div className="bg-muted/40 rounded-xl border border-border/60 px-4 py-3">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {t("metrics.answerLimit")}
        </p>
        <p className="mt-1 font-semibold tabular-nums">{recordingSeconds}s</p>
      </div>
    </div>
  );
}

type InterviewVideoPlayerProps = {
  phase: Phase;
  previewRef: RefObject<HTMLVideoElement | null>;
  isPaused: boolean;
};
function InterviewVideoPlayer({
  phase,
  previewRef,
  isPaused,
}: InterviewVideoPlayerProps) {
  const t = useTranslations("InterviewPhase");
  return (
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
                ? t("preview.countdownPaused")
                : t("preview.countdownAutoStart")}
            </div>
          ) : null}
          {phase === "recording" && isPaused ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/35 px-6 text-center text-sm leading-relaxed">
              {t("preview.recordingPaused")}
            </div>
          ) : null}
        </>
      ) : (
        <div className="text-muted-foreground flex aspect-video items-center justify-center px-6 text-center text-sm leading-relaxed">
          {t("preview.idle")}
        </div>
      )}
    </div>
  );
}

type CountdownProps = {
  countdown: number;
  isPaused: boolean;
};
function Countdown({ countdown, isPaused }: CountdownProps) {
  const t = useTranslations("InterviewPhase");
  return (
    <div className="text-center">
      <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
        {isPaused ? t("countdown.paused") : t("countdown.startingIn")}
      </p>
      <div className="text-primary mt-2 text-7xl font-semibold tabular-nums md:text-8xl">
        {countdown}
      </div>
    </div>
  );
}

function ResumeHelp() {
  const t = useTranslations("InterviewPhase");
  return (
    <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
      {t("countdown.resumeHelp")}
    </p>
  );
}

type InterviewHeaderProps = {
  isRetaking: boolean;
  hasInterviewStarted: boolean;
  questionHeading: string | null;
  showSessionTools: boolean;
  onTogglePause: () => void;
  canEndEarly: boolean;
  isPaused: boolean;
  onEndEarly: () => void;
};
function InterviewHeader({
  isRetaking,
  hasInterviewStarted,
  questionHeading,
  showSessionTools,
  onTogglePause,
  canEndEarly,
  isPaused,
  onEndEarly,
}: InterviewHeaderProps) {
  const t = useTranslations("InterviewPhase");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="font-normal tracking-wide" variant="secondary">
          {isRetaking
            ? t("badge.retake")
            : hasInterviewStarted
              ? t("badge.live")
              : t("badge.ready")}
        </Badge>
        {questionHeading && (
          <span className="text-muted-foreground text-xs">
            {questionHeading}
          </span>
        )}
      </div>
      {showSessionTools && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onTogglePause}
            data-icon="inline-start"
            size="sm"
            type="button"
            variant="outline"
          >
            {isPaused ? <IconPlayerPlayFilled /> : <IconPlayerPauseFilled />}
            {isPaused ? t("actions.resume") : t("actions.pause")}
          </Button>
          {canEndEarly && (
            <Button
              onClick={onEndEarly}
              size="sm"
              type="button"
              variant="destructive"
              data-icon="inline-start"
            >
              <IconPlayerStopFilled />
              {t("actions.endEarly")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function InterviewLocked() {
  return (
    <div className="absolute inset-0 z-[1] rounded-xl ring-1 ring-primary/25 ring-inset" />
  );
}

type InterviewQuestionProps = {
  question: string;
  phase: Phase;
};
function InterviewQuestion({ question, phase }: InterviewQuestionProps) {
  return (
    <div
      className={`transition-all duration-300 ${
        phase === "recording" ? "text-center" : "text-center md:px-2"
      }`}
    >
      <h2
        className={`font-semibold leading-tight tracking-tight transition-all duration-300 ${
          phase === "recording"
            ? "text-foreground/90 text-lg md:text-xl"
            : "text-3xl md:text-4xl"
        }`}
      >
        {question}
      </h2>
    </div>
  );
}

function PrimaryButton({
  className,
  ...rest
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn("rounded-full px-8 py-6 text-base", className)}
      size="lg"
      type="button"
      {...rest}
    />
  );
}

type PreInterviewSectionProps = {
  onStart: () => void;
  isPreparing: boolean;
  isRetaking: boolean;
};
function PreInterviewSection({
  onStart,
  isPreparing,
  isRetaking,
}: PreInterviewSectionProps) {
  const t = useTranslations("InterviewPhase");

  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-2">
      <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
        {t("intro")}
      </p>
      <PrimaryButton disabled={isPreparing} onClick={onStart}>
        {isPreparing
          ? t("actions.preparingCamera")
          : isRetaking
            ? t("actions.retryRetake")
            : t("actions.start")}
      </PrimaryButton>
    </div>
  );
}

type RecordingSectionProps = {
  isPaused: boolean;
  recordingElapsedSeconds: number;
  recordingSeconds: number;
  onDoneRecording: () => void;
};
function RecordingTimer({
  isPaused,
  recordingElapsedSeconds,
  recordingSeconds,
  onDoneRecording,
}: RecordingSectionProps) {
  const t = useTranslations("InterviewPhase");

  return (
    <div className="flex flex-col items-center gap-6 transition-opacity duration-300">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1 text-sm">
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
            {isPaused ? t("recording.paused") : t("recording.active")}
          </span>
        </div>
        <div className="text-5xl font-semibold tabular-nums tracking-tight md:text-6xl">
          {formatSeconds(recordingElapsedSeconds)}
        </div>
        <p className="text-muted-foreground text-xs">
          {isPaused
            ? t("recording.timerPaused")
            : t("recording.stopsAt", {
                limit: formatSeconds(recordingSeconds),
              })}
        </p>
      </div>

      <Button
        className="rounded-full"
        onClick={onDoneRecording}
        type="button"
        variant="default"
        data-icon="inline-start"
      >
        <IconCheck />
        {t("actions.done")}
      </Button>
    </div>
  );
}
