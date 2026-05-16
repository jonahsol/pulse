"use client";

import { useBookmark } from "@/app/[locale]/review/review-question-card/useBookmark";
import { QuestionCard } from "@/components/shared/question-card";
import { ResponseVideo } from "@/components/shared/response-video";
import { TranscriptSection } from "@/components/shared/transcript";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Question, Response } from "@/logic/types";
import { BookmarkIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ComponentProps, useLayoutEffect, useRef } from "react";

type ReviewQuestionCardProps = {
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
    <QuestionCard.Outer>
      <QuestionCard.Header>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {t("questionBadge", { question: question.index + 1 })}
            </Badge>

            <Badge variant="outline">
              {t("limit", { seconds: questionDuration })}
            </Badge>
          </div>

          <QuestionCard.QuestionTitle>
            {question.prompt}
          </QuestionCard.QuestionTitle>
        </div>
        <Button size="sm" type="button" onClick={onAddTake}>
          <PlusIcon />
          {t("actions.addTake")}
        </Button>
      </QuestionCard.Header>
      <QuestionCard.Content>
        {hasNoResponse ? (
          <Alert>
            <AlertTitle>{t("noResponse.title")}</AlertTitle>
            <AlertDescription>{t("noResponse.description")}</AlertDescription>
          </Alert>
        ) : (
          <ScrollArea ref={scrollContainerRef} type="always">
            <div
              className={`flex gap-4 pb-5 px-6 ${responses.length === 1 ? "justify-center" : ""}`}
            >
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
                    question={question}
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
      </QuestionCard.Content>
    </QuestionCard.Outer>
  );
}

type TakeTitleProps = {
  takeNumber: number;
  isLatest: boolean;
};

function TakeTitle({ takeNumber, isLatest }: TakeTitleProps) {
  const t = useTranslations("ReviewQuestionCard");

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
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
  question: Question;
};

function TakeCard({
  response,
  question,
  attemptIndex,
  isLatestAttempt,
  onResponse,
}: TakeCardProps) {
  const { isBookmarked, handleBookmark } = useBookmark({ response, question });

  return (
    <div className="flex w-[500px] flex-col gap-3 rounded-lg border bg-card px-4 py-3 shrink-0">
      <div className="flex items-center justify-between gap-3 pl-2">
        <TakeTitle takeNumber={attemptIndex + 1} isLatest={isLatestAttempt} />
        <BookmarkButton
          isBookmarked={isBookmarked}
          buttonProps={{
            onClick: handleBookmark,
          }}
        />
      </div>

      <ResponseVideo response={response} className="rounded-lg" />

      <TranscriptSection response={response} onResponse={onResponse} />
    </div>
  );
}

type BookmarkButtonProps = {
  buttonProps: ComponentProps<typeof Button>;
  isBookmarked: boolean;
};
function BookmarkButton({ buttonProps, isBookmarked }: BookmarkButtonProps) {
  const t = useTranslations("ReviewQuestionCard");
  return (
    <Tooltip>
      <TooltipContent side="bottom">
        <div className="flex items-center gap-2">
          {isBookmarked ? t("bookmark.saved") : t("bookmark.default")}
        </div>
      </TooltipContent>
      <TooltipTrigger asChild>
        <Button size="icon-lg" type="button" variant={"ghost"} {...buttonProps}>
          <BookmarkIcon
            className="size-5"
            fill={isBookmarked ? "currentColor" : "none"}
          />
        </Button>
      </TooltipTrigger>
    </Tooltip>
  );
}
