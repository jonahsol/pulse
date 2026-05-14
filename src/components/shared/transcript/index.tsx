"use client";

import { TranscriptApiJson } from "@/components/shared/transcript/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copyable";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useResponseBlobQuery } from "@/logic/storage/queries";
import type { Response } from "@/logic/types";
import { IconCheck, IconSubtitlesAi } from "@tabler/icons-react";
import {
  type MutationState,
  useMutation,
  useMutationState,
} from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type TranscriptSectionProps = {
  response: Response;
  onResponse: (response: Response) => void;
  className?: string;
};
export function TranscriptSection({
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
export function TranscriptButton({
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

export function TranscriptErrors({ response }: { response: Response }) {
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
