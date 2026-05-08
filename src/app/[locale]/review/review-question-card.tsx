"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copyable } from "@/components/ui/copyable";
import { Separator } from "@/components/ui/separator";
import { Question, QuestionResponse } from "@/logic/types";
import { IconPlus, IconSubtitlesAi } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

type ReviewQuestionCardProps = {
  endedEarly: boolean;
  question: Question;
  questionDuration: number;
  responses: QuestionResponse[];
  onResponses: (responses: QuestionResponse[]) => void;
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

  const latestAttemptIndex = responses.length - 1;
  const hasNoResponse = responses.length === 0;

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
          <div className="flex gap-5 overflow-x-auto px-5 pb-5">
            {/* {repeat(responses[0], 10).map((response, attemptIndex) => { */}
            {responses.map((response, attemptIndex) => {
              const isLatestAttempt = attemptIndex === latestAttemptIndex;

              return (
                <div
                  key={response.id}
                  className="flex flex-col gap-4 min-w-3/4 flex-1"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {t("take", { number: attemptIndex + 1 })}
                        {attemptIndex === 0 ? ` ${t("originalSuffix")}` : ""}
                      </span>
                      {isLatestAttempt ? (
                        <Badge variant="secondary">{t("latest")}</Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ResponseControls
                        response={response}
                        onResponse={(response) => {
                          // Replace the response in the responses array
                          onResponses(
                            responses.map((r) =>
                              r.id === response.id ? response : r,
                            ),
                          );
                        }}
                      />
                    </div>
                    {/* <span className="text-muted-foreground text-xs">
                      {new Date(response.createdAt).toLocaleTimeString()}
                    </span> */}
                  </div>

                  {/* biome-ignore lint/a11y/useMediaCaption: Local interview recordings do not have generated captions in this prototype. */}
                  <video
                    className="w-full rounded-lg border border-border bg-black"
                    controls
                    playsInline
                    preload="metadata"
                    src={URL.createObjectURL(response.recording)}
                  />
                  {response.transcript && (
                    <Copyable
                      copyValue={response.transcript}
                      hoverTooltip={t("transcript.copyTooltip")}
                      copiedTooltip={t("transcript.copiedTooltip")}
                    >
                      <p>{response.transcript}</p>
                    </Copyable>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type ResponseControlsProps = {
  response: QuestionResponse;
  onResponse: (response: QuestionResponse) => void;
};
function ResponseControls({ response, onResponse }: ResponseControlsProps) {
  const t = useTranslations("ReviewQuestionCard");

  const transcriptMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("file", response.recording);
      const resp = await fetch("/api/transcript", {
        method: "POST",
        body: formData,
      });

      return resp.json();
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
      {/* <Button
        aria-pressed={isSaved}
        disabled={isSaving}
        //    onClick={() =>
        //      void toggleBookmark.run({
        //        question: questionRecording.question,
        //        questionIndex,
        //        recording,
        //      })
        //    }
        size="sm"
        type="button"
        variant={isSaved ? "secondary" : "outline"}
      >
        <BookmarkIcon className="size-4" filled={isSaved} />
        {isSaving
          ? t("bookmark.saving")
          : isSaved
            ? t("bookmark.saved")
            : t("bookmark.default")}
      </Button> */}
      <Button
        disabled={transcriptMutation.isPending}
        onClick={() => {
          transcriptMutation.mutate();
        }}
        size="sm"
        type="button"
        variant="outline"
        data-icon="inline-start"
      >
        <IconSubtitlesAi />
        {transcriptMutation.isPending
          ? t("transcript.generating")
          : response.transcript
            ? t("transcript.regenerate")
            : t("transcript.default")}
      </Button>
    </>
  );
}
