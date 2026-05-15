"use client";

import { InterviewConfigForm } from "@/app/[locale]/practice/components/config-form";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsOverflow } from "@/lib/use-is-overflow";
import { cn } from "@/lib/utils";
import { currentInterviewAtom } from "@/logic/atoms";
import {
  useInterviewContext,
  useInterviewRuntimeContext,
} from "@/logic/context";
import { getInterviewConfigFromAtomState } from "@/logic/interview";
import type { InterviewState } from "@/logic/types";
import { useMutation } from "@tanstack/react-query";
import {
  CheckIcon,
  PauseIcon,
  PlayIcon,
  SquareIcon,
} from "lucide-react";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";

export default function InterviewPhase() {
  const t = useTranslations("InterviewPhase");
  const interview = useAtomValue(currentInterviewAtom);
  const {
    startInterview,
    isPaused,
    togglePauseInterview,
    endResponse,
    endInterviewEarly,
  } = useInterviewRuntimeContext();
  const startInterviewMutation = useMutation({
    mutationFn: startInterview,
  });

  return (
    <div className="flex-1 flex flex-col justify-center">
      <Card className="gap-5 relative w-full border-border/80 bg-card/80 shadow-none backdrop-blur-sm transition-opacity duration-300">
        {interview.phase !== "preparing" && (
          <CardHeader className="gap-4 space-y-0 px-0">
            <InterviewHeader
              canEndEarly={true}
              currentQuestionIndex={interview.currentQuestionIndex}
              isPaused={isPaused}
              isRetaking={interview.isRetaking}
              onEndEarly={endInterviewEarly}
              onTogglePause={togglePauseInterview}
              questionCount={interview.questions.length}
            />
            <Separator />
          </CardHeader>
        )}

        <CardContent className="flex flex-col gap-6">
          {interview.phase === "preparing" && (
            <StartInterviewSection
              isStarting={startInterviewMutation.isPending}
              onStart={() =>
                startInterviewMutation.mutate(getInterviewConfigFromAtomState())
              }
            />
          )}

          {(interview.phase === "question" ||
            interview.phase === "countdown") && (
            <div className="flex flex-col justify-center gap-6 h-60">
              <InterviewQuestion
                prompt={
                  interview.questions[interview.currentQuestionIndex].prompt
                }
                variant={
                  interview.phase === "question" ? "recording" : "standard"
                }
              />
              {interview.phase === "question" && (
                <RecordingTimer
                  isPaused={isPaused}
                  recordingElapsedSeconds={interview.questionTime}
                  recordingSeconds={interview.questionDuration}
                  onFinishResponse={endResponse}
                />
              )}
              {interview.phase === "countdown" && (
                <Countdown
                  countdown={
                    interview.countdownDuration - interview.countdownTime
                  }
                  isPaused={isPaused}
                />
              )}
            </div>
          )}

          <InterviewVideoPlayer phase={interview.phase} isPaused={isPaused} />
        </CardContent>

        {(interview.phase === "preparing" ||
          startInterviewMutation.isError) && (
          <CardFooter>
            {startInterviewMutation.isError && (
              <Alert variant="destructive">
                <AlertTitle>{t("errors.title")}</AlertTitle>
                <AlertDescription>
                  {startInterviewMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
            {interview.phase === "preparing" && <InterviewConfigForm />}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
type InterviewVideoPlayerProps = {
  phase: InterviewState["phase"];
  isPaused: boolean;
};
function InterviewVideoPlayer({ phase, isPaused }: InterviewVideoPlayerProps) {
  const t = useTranslations("InterviewPhase");
  const { userMediaPreviewRef } = useInterviewContext();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-black transition-opacity duration-300 ${
        phase === "countdown" ? "opacity-90" : "opacity-100"
      }`}
    >
      <video
        autoPlay
        className={`aspect-video w-full object-cover transition-all duration-300 ${
          phase === "countdown" ? "scale-[1.02] blur-[1px]" : ""
        }`}
        muted
        playsInline
        ref={userMediaPreviewRef}
      />
      {phase === "countdown" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/20 px-6 text-center text-sm leading-relaxed text-foreground">
          {isPaused
            ? t("preview.countdownPaused")
            : t("preview.countdownAutoStart")}
        </div>
      ) : null}
      {phase === "question" && isPaused ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/35 px-6 text-center text-sm leading-relaxed">
          {t("preview.recordingPaused")}
        </div>
      ) : null}
      {phase === "preparing" && (
        <div className="absolute inset-0 text-muted-foreground flex aspect-video items-center justify-center px-6 text-center text-sm leading-relaxed">
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

type InterviewHeaderProps = {
  canEndEarly: boolean;
  currentQuestionIndex: number;
  isPaused: boolean;
  isRetaking: boolean;
  onEndEarly: () => void;
  onTogglePause: () => void;
  questionCount: number;
};
function InterviewHeader({
  canEndEarly,
  currentQuestionIndex,
  isPaused,
  isRetaking,
  onEndEarly,
  onTogglePause,
  questionCount,
}: InterviewHeaderProps) {
  const t = useTranslations("InterviewPhase");

  const questionHeading = !isRetaking
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
    <div className="flex flex-wrap items-center justify-between gap-3 px-4">
      <div className="flex flex-wrap items-center gap-2">
        {questionHeading && (
          <span className="text-muted-foreground text-xs">
            {questionHeading}
          </span>
        )}
        <Badge className="font-normal tracking-wide" variant="secondary">
          {isRetaking ? t("badge.retake") : t("badge.live")}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={onTogglePause}
          data-icon="inline-start"
          size="sm"
          type="button"
          variant="outline"
        >
          {isPaused ? <PlayIcon /> : <PauseIcon />}
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
            <SquareIcon />
            {t("actions.endEarly")}
          </Button>
        )}
      </div>
    </div>
  );
}

type InterviewQuestionProps = {
  prompt: string;
  variant: "standard" | "recording";
};
function InterviewQuestion({ prompt, variant }: InterviewQuestionProps) {
  const { isOverflow, elementRef } = useIsOverflow();

  const contentNode = (
    <div
      className={`transition-all duration-300 ${
        variant === "recording" ? "text-center" : "text-center md:px-2"
      }`}
    >
      <h2
        ref={elementRef}
        className={`line-clamp-3 font-semibold leading-tight tracking-tight transition-all duration-300 ${
          variant === "recording"
            ? "text-foreground/90 text-lg md:text-xl"
            : "text-2xl md:text-3xl"
        }`}
      >
        {prompt}
      </h2>
    </div>
  );

  if (!isOverflow) return contentNode;
  else
    return (
      <Tooltip>
        <TooltipContent side="bottom">
          <p>{prompt}</p>
        </TooltipContent>
        <TooltipTrigger asChild>{contentNode}</TooltipTrigger>
      </Tooltip>
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

type StartInterviewSectionProps = {
  onStart: () => void;
  isStarting: boolean;
};
function StartInterviewSection({
  onStart,
  isStarting,
}: StartInterviewSectionProps) {
  const t = useTranslations("InterviewPhase");

  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-2">
      <p className="text-muted-foreground text-base leading-relaxed md:text-lg text-center">
        {t("intro")}
      </p>
      <PrimaryButton onClick={onStart}>
        {isStarting ? t("actions.preparingCamera") : t("actions.start")}
      </PrimaryButton>
    </div>
  );
}

export function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type RecordingTimerProps = {
  isPaused: boolean;
  recordingElapsedSeconds: number;
  recordingSeconds: number;
  onFinishResponse: () => void;
};
function RecordingTimer({
  isPaused,
  recordingElapsedSeconds,
  recordingSeconds,
  onFinishResponse,
}: RecordingTimerProps) {
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
        onClick={onFinishResponse}
        type="button"
        variant="default"
        data-icon="inline-start"
      >
        <CheckIcon />
        {t("actions.done")}
      </Button>
    </div>
  );
}
