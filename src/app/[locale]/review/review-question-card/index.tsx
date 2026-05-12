"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copyable";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useResponseBlobQuery } from "@/logic/storage/queries";
import type { Question, Response } from "@/logic/types";
import { IconCheck, IconPlus, IconSubtitlesAi } from "@tabler/icons-react";
import {
  type MutationState,
  useMutation,
  useMutationState,
} from "@tanstack/react-query";
import { AlertTriangleIcon, BookmarkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** JSON body from `POST /api/transcript` (success or error payload). */
type TranscriptApiJson = {
  transcript?: string;
  error?: string;
};

type ReviewQuestionCardProps = {
  endedEarly: boolean;
  question: Question;
  questionDuration: number;
  responses: Response[];
  onResponses: (responses: Response[]) => void;
  onAddTake: () => void;
};

export function ReviewQuestionCard({
  onAddTake,
  questionDuration,
  question,
  responses,
  onResponses,
  endedEarly,
}: ReviewQuestionCardProps) {
  const t = useTranslations("ReviewQuestionCard");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestAttemptIndex = responses.length - 1;
  const hasNoResponse = responses.length === 0;

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
      });
    }
  });

  return (
    <Card className="border-border/80 bg-card/90 shadow-none backdrop-blur-sm gap-7 py-6">
      <CardHeader className="flex flex-col gap-5 items-stretch px-0 space-y-0">
        <div className="flex items-start justify-between gap-4 px-6">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center gap-1">
              <Badge variant="secondary">
                {t("questionBadge", { question: question.index + 1 })}
              </Badge>

              <Badge variant="outline">
                {t("limit", { seconds: questionDuration })}
              </Badge>
            </div>

            <div className="border-l-2 border-border pl-3">
              <CardTitle className="text-xl font-medium leading-snug">
                {question.prompt}
              </CardTitle>
            </div>
          </div>
          <Button size="sm" type="button" onClick={onAddTake}>
            <IconPlus />
            {t("actions.addTake")}
          </Button>
        </div>
        <Separator />
      </CardHeader>
      <CardContent className="space-y-4 p-0 -mb-4">
        {hasNoResponse ? (
          <Alert>
            <AlertTitle>
              {endedEarly
                ? t("noResponse.endedEarlyTitle")
                : t("noResponse.title")}
            </AlertTitle>
            <AlertDescription>
              {endedEarly
                ? t("noResponse.endedEarlyDescription")
                : t("noResponse.description")}
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea ref={scrollContainerRef} type="always">
            <div className="flex gap-4 pb-5 px-6">
              {responses.map((response, attemptIndex) => {
                const isLatestAttempt = attemptIndex === latestAttemptIndex;
                const handleResponse = (next: Response) => {
                  onResponses(
                    responses.map((r) => (r.id === next.id ? next : r)),
                  );
                };

                return (
                  <TakeCard
                    key={response.id}
                    response={response}
                    attemptIndex={attemptIndex}
                    isLatestAttempt={isLatestAttempt}
                    onResponse={handleResponse}
                  />
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="m-2 h-4" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

type TakeTitleProps = {
  takeNumber: number;
  isLatest: boolean;
};

function TakeTitle({ takeNumber, isLatest }: TakeTitleProps) {
  const t = useTranslations("ReviewQuestionCard");

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="font-medium text-lg">
        {t("take", { number: takeNumber })}
      </span>
      {isLatest ? <Badge variant="secondary">{t("latest")}</Badge> : null}
    </div>
  );
}

type TakeCardProps = {
  response: Response;
  attemptIndex: number;
  isLatestAttempt: boolean;
  onResponse: (response: Response) => void;
};

function TakeCard({
  response,
  attemptIndex,
  isLatestAttempt,
  onResponse,
}: TakeCardProps) {
  return (
    <div className="flex w-[500px] flex-col gap-3 rounded-lg border bg-card px-4 py-3 shrink-0">
      <div className="flex items-center justify-between gap-3 pl-2">
        <TakeTitle takeNumber={attemptIndex + 1} isLatest={isLatestAttempt} />
        <ResponseControls response={response} onResponse={onResponse} />
      </div>

      <ResponseVideo response={response} />

      <TranscriptSection response={response} onResponse={onResponse} />
    </div>
  );
}

function ResponseVideo({ response }: { response: Response }) {
  const responseBlobQuery = useResponseBlobQuery(response.id);

  const [responseBlobUrl, setResponseBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!responseBlobQuery.data) {
      setResponseBlobUrl(null);
      return;
    }

    const url = URL.createObjectURL(responseBlobQuery.data);
    setResponseBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      setResponseBlobUrl(null);
    };
  }, [responseBlobQuery.data]);

  const [aspectRatio, setAspectRatio] = useState<string>("16 / 9");
  const handleLoadedMetadata = (
    event: React.SyntheticEvent<HTMLVideoElement>,
  ) => {
    const video = event.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
    }
  };

  return (
    <div
      className="w-full overflow-hidden rounded-lg border border-border bg-black"
      style={{ aspectRatio }}
    >
      {responseBlobQuery.isPending || !responseBlobUrl ? (
        <Skeleton className="size-full" />
      ) : (
        // biome-ignore lint/a11y/useMediaCaption: Local interview recordings do not have generated captions in this prototype.
        <video
          className="size-full object-contain"
          controls
          playsInline
          src={responseBlobUrl}
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}
    </div>
  );
}

type ResponseControlsProps = {
  response: Response;
  onResponse: (response: Response) => void;
};
function ResponseControls({ response, onResponse }: ResponseControlsProps) {
  return <BookmarkButton />;
}

function BookmarkButton() {
  const t = useTranslations("ReviewQuestionCard");
  return (
    <Tooltip>
      <TooltipContent side="bottom">
        <div className="flex items-center gap-2">{t("bookmark.tooltip")}</div>
      </TooltipContent>
      <TooltipTrigger asChild>
        <Button size="icon-lg" type="button" variant={"ghost"}>
          <BookmarkIcon className="size-5" />
        </Button>
      </TooltipTrigger>
    </Tooltip>
  );
}

type TranscriptSectionProps = {
  response: Response;
  onResponse: (response: Response) => void;
  className?: string;
};
function TranscriptSection({
  response,
  onResponse,
  className,
}: TranscriptSectionProps) {
  const t = useTranslations("ReviewQuestionCard");

  const handleResponse = (response: Response) => {
    onResponse(response);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {response.transcript ? (
        <div className="flex items-center gap-2 pl-2">
          <p className="max-h-50 overflow-y-auto">{response.transcript}</p>
          <div className="flex items-center">
            <CopyButton
              copyValue={response.transcript}
              hoverTooltip={t("transcript.copyTooltip")}
              copiedTooltip={t("transcript.copiedTooltip")}
            />
            <TranscriptButton
              variant="regenerate"
              response={response}
              onResponse={handleResponse}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <TranscriptButton
            variant="default"
            response={response}
            onResponse={handleResponse}
          />
        </div>
      )}

      <TranscriptErrors response={response} />
    </div>
  );
}

type TranscriptButtonProps = {
  response: Response;
  onResponse: (response: Response) => void;
  variant?: "regenerate" | "default";
  iconClassName?: string;
  children?: React.ReactNode;
  buttonProps?: React.ComponentProps<typeof Button>;
};
function TranscriptButton({
  response,
  onResponse,
  variant = "default",
  iconClassName,
  buttonProps = {},
}: TranscriptButtonProps) {
  const t = useTranslations("ReviewQuestionCard");
  const responseBlobQuery = useResponseBlobQuery(response.id);

  const transcriptMutation = useMutation<TranscriptApiJson, Error>({
    mutationKey: ["transcript", response.id],
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("file", responseBlobQuery.data as Blob);
      const resp = await fetch("/api/transcript", {
        method: "POST",
        body: formData,
      });
      return (await resp.json()) as TranscriptApiJson;
    },
    onSuccess: (data) => {
      onResponse({
        ...response,
        transcript: data.transcript,
      });
    },
  });

  const iconNode = transcriptMutation.isPending ? (
    <Spinner className={iconClassName} />
  ) : transcriptMutation.isSuccess ? (
    <IconCheck className={iconClassName} />
  ) : (
    <IconSubtitlesAi className={iconClassName} />
  );

  if (variant === "regenerate") {
    return (
      <Tooltip>
        <TooltipContent side="bottom">
          <div className="flex items-center gap-2">
            {transcriptMutation.isPending
              ? t("transcript.regeneratingTooltip")
              : transcriptMutation.isSuccess
                ? t("transcript.regeneratedTooltip")
                : t("transcript.regenerateTooltip")}
          </div>
        </TooltipContent>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="-mt-1 -mr-1"
            onClick={() => transcriptMutation.mutate()}
            {...buttonProps}
          >
            {iconNode}
          </Button>
        </TooltipTrigger>
      </Tooltip>
    );
  }

  return (
    <Button
      disabled={transcriptMutation.isPending}
      onClick={() => {
        transcriptMutation.mutate();
      }}
      variant="ghost"
      {...buttonProps}
    >
      {iconNode}
      {transcriptMutation.isPending
        ? t("transcript.generating")
        : response.transcript
          ? t("transcript.regenerate")
          : t("transcript.default")}
    </Button>
  );
}

function TranscriptErrors({ response }: { response: Response }) {
  const t = useTranslations("InterviewTrainer");
  const transcriptMutationState = useMutationState<
    MutationState<TranscriptApiJson>
  >({
    filters: {
      mutationKey: ["transcript", response.id],
    },
  });

  return transcriptMutationState
    .filter((mutation) => mutation.data?.error || mutation.error)
    .map((mutation) => {
      return (
        // Show errors
        <Alert key={mutation.error?.name}>
          <AlertTriangleIcon />
          <AlertTitle>{t("errors.transcriptionFailed")}</AlertTitle>
          {mutation.data?.error ? (
            <AlertDescription>{mutation.data.error}</AlertDescription>
          ) : null}
        </Alert>
      );
    });
}
