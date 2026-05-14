import { QuestionCard } from "@/components/shared/question-card";
import { ResponseVideo } from "@/components/shared/response-video";
import { TranscriptSection } from "@/components/shared/transcript";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsOverflow } from "@/lib/use-is-overflow";
import { SavedTake } from "@/logic/types";
import { Trash2, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

type SavedTakeCardProps = {
  savedTake: SavedTake;
  onSavedTake: (savedTake: SavedTake) => void;
  onDelete: () => void;
};
export function SavedTakeCard({
  savedTake,
  onSavedTake,
  onDelete,
}: SavedTakeCardProps) {
  return (
    <QuestionCard.Outer className="group">
      <QuestionCard.Header className="h-[80px]" withSeparator={false}>
        <QuestionTitleWithTooltip questionText={savedTake.question.prompt} />
      </QuestionCard.Header>
      <QuestionCard.Content className="space-y-0 flex flex-col gap-2">
        <ResponseVideo response={savedTake.response} />
        <TranscriptSection
          response={savedTake.response}
          onResponse={(response) => onSavedTake({ ...savedTake, response })}
          className="flex-1 pl-2"
        />
      </QuestionCard.Content>
      <Tooltip>
        <TooltipTrigger asChild>
          <DeleteButton onDelete={onDelete} />
        </TooltipTrigger>

        <TooltipContent>Delete take</TooltipContent>
      </Tooltip>
    </QuestionCard.Outer>
  );
}

type QuestionTitleWithTooltipProps = {
  questionText: string;
};
function QuestionTitleWithTooltip({
  questionText,
}: QuestionTitleWithTooltipProps) {
  const { isOverflow, elementRef } = useIsOverflow();

  const contentNode = (
    <QuestionCard.QuestionTitle className="line-clamp-3" ref={elementRef}>
      {questionText}
    </QuestionCard.QuestionTitle>
  );

  if (!isOverflow) return contentNode;
  else
    return (
      <Tooltip>
        <TooltipContent side="bottom">
          <p>{questionText}</p>
        </TooltipContent>
        <TooltipTrigger asChild>{contentNode}</TooltipTrigger>
      </Tooltip>
    );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const t = useTranslations("SavedTakesPage");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="destructive"
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{t("deleteConfirmation.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteConfirmation.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">
            {t("deleteConfirmation.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>
            {t("deleteConfirmation.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
