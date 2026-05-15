"use client";

import { ReviewQuestionCard } from "@/app/[locale]/review/review-question-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsClient } from "@/lib/client-utils";
import { previousInterviewAtom } from "@/logic/atoms";
import { useAddTake } from "@/logic/interview";
import { InterviewState, Question, Response } from "@/logic/types";
import { RefreshCwIcon } from "lucide-react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function ReviewPhase() {
  const t = useTranslations("ReviewPhase");
  const router = useRouter();
  const endedEarly = false;
  const [previousInterview, setPreviousInterview] = useAtom(
    previousInterviewAtom,
  );
  const isClient = useIsClient();
  const { addTake } = useAddTake();

  function setResponsesForQuestion(questionId: string, responses: Response[]) {
    setPreviousInterview((prev) => ({
      ...(prev as InterviewState),
      responses: {
        ...(prev?.responses || {}),
        [questionId]: responses,
      },
    }));
  }

  return (
    <div className="flex-1 flex flex-col justify-center">
      <div className="space-y-6 pb-8">
        <Card className="border-border/80 bg-card/80 shadow-none backdrop-blur-sm">
          <CardHeader className="gap-4 space-y-0 px-0">
            <div className="px-4 flex flex-col gap-2">
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <Separator />
          </CardHeader>
          <CardContent className="space-y-4">
            {endedEarly ? (
              <Alert>
                <AlertTitle>{t("endedEarly.title")}</AlertTitle>
                <AlertDescription>
                  {t("endedEarly.description")}
                </AlertDescription>
              </Alert>
            ) : null}
            <Button
              className="w-full rounded-full sm:w-auto"
              onClick={() => {
                router.push("/practice");
              }}
              type="button"
              data-icon="inline-start"
            >
              <RefreshCwIcon />
              {t("actions.startNewInterview")}
            </Button>
          </CardContent>
        </Card>

        {!isClient ? (
          <SkeletonState />
        ) : previousInterview ? (
          Object.entries(previousInterview.responses).map(
            ([questionId, responses]) => {
              const question = previousInterview.questions.find(
                (question) => question.id === questionId,
              ) as Question;

              return (
                <ReviewQuestionCard
                  onAddTake={() => addTake(previousInterview, question.index)}
                  questionDuration={previousInterview.questionDuration}
                  question={question}
                  responses={responses}
                  onResponses={(responses) =>
                    setResponsesForQuestion(questionId, responses)
                  }
                  endedEarly={endedEarly}
                  key={questionId}
                />
              );
            },
          )
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("ReviewPhase");

  return (
    <Card className="border-dashed border-border/80 bg-muted/20 shadow-none">
      <CardContent className="text-muted-foreground space-y-4 py-8 text-sm leading-relaxed">
        <p>{t("emptyState")}</p>
      </CardContent>
    </Card>
  );
}

function SkeletonState() {
  return <Skeleton className="h-[500px] w-full" />;
}
