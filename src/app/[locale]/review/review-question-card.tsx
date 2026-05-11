"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copyable";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResponseBlobQuery } from "@/logic/storage/queries";
import { Question, Response } from "@/logic/types";
import {
  IconAlertCircle,
  IconCheck,
  IconPlus,
  IconSubtitlesAi,
} from "@tabler/icons-react";
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
    <Card className="border-border/80 bg-card/90 shadow-none backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-4 items-stretch px-0 space-y-0">
        <div className="px-4 flex flex-col gap-2">
          <div className="flex justify-between">
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="secondary">
                {t("questionBadge", { question: question.index + 1 })}
              </Badge>

              <Badge variant="outline">
                {t("limit", { seconds: questionDuration })}
              </Badge>
            </div>

            <Button
              // disabled={isPreparing || isLocked}
              // onClick={() => {
              //   void startRetake.run(questionIndex);
              // }}
              size="sm"
              type="button"
              data-icon="inline-start"
              onClick={onAddTake}
            >
              <IconPlus />
              {t("actions.addTake")}
            </Button>
          </div>
          <CardTitle className="text-lg font-medium leading-snug">
            {question.prompt}
          </CardTitle>
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
          <div
            className="flex gap-5 overflow-x-auto px-5 pb-5"
            ref={scrollContainerRef}
          >
            {/* {repeat(responses[0], 10).map((response, attemptIndex) => { */}
            {responses.map((response, attemptIndex) => {
              const isLatestAttempt = attemptIndex === latestAttemptIndex;
              const handleResponse = (response: Response) => {
                // Replace the response in the responses array
                onResponses(
                  responses.map((r) => (r.id === response.id ? response : r)),
                );
              };

              return (
                <div
                  key={response.id}
                  className="flex flex-col gap-4 min-w-3/4 flex-1"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {t("take", { number: attemptIndex + 1 })}
                      </span>
                      {isLatestAttempt && (
                        <Badge variant="secondary">{t("latest")}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ResponseControls
                        response={response}
                        onResponse={handleResponse}
                      />
                    </div>
                  </div>

                  <ResponseVideo response={response} />
                  <TranscriptSection
                    response={response}
                    onResponse={handleResponse}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResponseVideo({ response }: { response: Response }) {
  const responseBlobQuery = useResponseBlobQuery(response.id);

  // Create object URL for the blob
  const [responseBlobUrl, setResponseBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (responseBlobQuery.data) {
      setResponseBlobUrl(URL.createObjectURL(responseBlobQuery.data));
    }

    return () => {
      // Clean up the blob URL
      if (responseBlobUrl) URL.revokeObjectURL(responseBlobUrl);
    };
  }, [responseBlobQuery.data]);

  if (responseBlobQuery.isPending || !responseBlobUrl) {
    return <Skeleton className="aspect-video w-full" />;
  } else if (responseBlobUrl) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: Local interview recordings do not have generated captions in this prototype.
      <video
        className="w-full aspect-video rounded-lg border border-border bg-black"
        controls
        playsInline
        src={responseBlobUrl}
      />
    );
  } else {
    return (
      <div className="w-full rounded-lg border border-border bg-black">
        <IconAlertCircle className="size-4" />
      </div>
    );
  }
}

type ResponseControlsProps = {
  response: Response;
  onResponse: (response: Response) => void;
};
function ResponseControls({ response, onResponse }: ResponseControlsProps) {
  const t = useTranslations("ReviewQuestionCard");
  const responseBlobQuery = useResponseBlobQuery(response.id);

  const transcriptMutation = useMutation<TranscriptApiJson, Error>({
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

  return (
    <>
      <Button
        // aria-pressed={isSaved}
        // disabled={isSaving}
        //    onClick={() =>
        //      void toggleBookmark.run({
        //        question: questionRecording.question,
        //        questionIndex,
        //        recording,
        //      })
        //    }
        size="icon-lg"
        type="button"
        variant={"outline"}
      >
        <BookmarkIcon />
        {/* {isSaving
          ? t("bookmark.saving")
          : isSaved
            ? t("bookmark.saved")
            : t("bookmark.default")} */}
      </Button>
    </>
  );
}

type TranscriptSectionProps = {
  response: Response;
  onResponse: (response: Response) => void;
};
function TranscriptSection({ response, onResponse }: TranscriptSectionProps) {
  const t = useTranslations("ReviewQuestionCard");

  const handleResponse = (response: Response) => {
    onResponse(response);
  };

  return (
    <div className="flex flex-col gap-3">
      {response.transcript && (
        <div className="flex items-center gap-2">
          <p>{response.transcript}</p>
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
      )}

      {!response.transcript && (
        <div>
          <TranscriptButton response={response} onResponse={handleResponse} />
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
};
function TranscriptButton({
  response,
  onResponse,
  variant = "default",
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
            size="icon"
            className="-mt-1 -mr-1"
            onClick={() => transcriptMutation.mutate()}
          >
            {transcriptMutation.isPending ? (
              <Spinner />
            ) : transcriptMutation.isSuccess ? (
              <IconCheck />
            ) : (
              <IconSubtitlesAi />
            )}
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
      variant={response.transcript ? "secondary" : "outline"}
    >
      <IconSubtitlesAi />
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
