import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { useAtom } from "jotai";
import {
  GripVerticalIcon,
  LoaderCircleIcon,
  SparkleIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ulid } from "ulid";
import { EditButton } from "@/app/[locale]/practice/components/ConfigForm/EditButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { questionsConfigAtom } from "@/logic/atoms";

type GeneratedQuestionsResponse = {
  questions?: string[];
  error?: string;
};

const questionPlaceholderRows = [
  "first-question-placeholder",
  "second-question-placeholder",
  "third-question-placeholder",
  "fourth-question-placeholder",
];

async function requestGeneratedQuestions({
  jobDescription,
  locale,
}: {
  jobDescription: string;
  locale: string;
}) {
  const response = await fetch("/api/question-generation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobDescription,
      locale,
    }),
  });

  const data = (await response.json()) as GeneratedQuestionsResponse;

  if (!response.ok || !data.questions?.length) {
    throw new Error(data.error ?? "generation_failed");
  }

  return data.questions;
}

export function EditQuestionsButton(props: ComponentProps<typeof Button>) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <EditButton {...props} />
      </DialogTrigger>
      <EditQuestionsModal />
    </Dialog>
  );
}

function EditQuestionsModal() {
  const t = useTranslations("EditQuestions");
  const locale = useLocale();
  const [questions, setQuestions] = useAtom(questionsConfigAtom);
  const [questionIds, setQuestionIds] = useState(() =>
    questions.map(() => ulid()),
  );
  const [jobDescription, setJobDescription] = useState("");
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const [generatedQuestionIds, setGeneratedQuestionIds] = useState(
    () => new Set<string>(),
  );
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const textareaRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const generatedQuestionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const generateQuestionsMutation = useMutation({
    mutationFn: requestGeneratedQuestions,
    onSuccess: (generatedQuestions) => {
      replaceQuestions(generatedQuestions);
    },
  });

  useEffect(() => {
    setQuestionIds((currentIds) => {
      if (currentIds.length === questions.length) {
        return currentIds;
      }

      return questions.map((_, index) => currentIds[index] ?? ulid());
    });
  }, [questions]);

  useEffect(() => {
    if (!pendingFocusId) {
      return;
    }

    const textarea = textareaRefs.current.get(pendingFocusId);
    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setPendingFocusId(null);
  }, [pendingFocusId]);

  const setTextareaRef = useCallback(
    (id: string) => (element: HTMLTextAreaElement | null) => {
      if (element) {
        textareaRefs.current.set(id, element);
      } else {
        textareaRefs.current.delete(id);
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (generatedQuestionTimeoutRef.current) {
        clearTimeout(generatedQuestionTimeoutRef.current);
      }
    };
  }, []);

  function handleQuestionChange(index: number, value: string) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, questionIndex) =>
        questionIndex === index ? value : question,
      ),
    );
  }

  function handleAddQuestion() {
    const id = ulid();
    setQuestionIds((currentIds) => [...currentIds, id]);
    setQuestions((currentQuestions) => [...currentQuestions, ""]);
    setPendingFocusId(id);
  }

  function handleDeleteQuestion(index: number) {
    if (questions.length === 1) {
      return;
    }

    setQuestionIds((currentIds) =>
      currentIds.filter((_, questionIndex) => questionIndex !== index),
    );
    setQuestions((currentQuestions) =>
      currentQuestions.filter((_, questionIndex) => questionIndex !== index),
    );
  }

  function handleReorder(nextQuestionIds: string[]) {
    const questionsById = new Map(
      questionIds.map((id, index) => [id, questions[index] ?? ""]),
    );

    setQuestionIds(nextQuestionIds);
    setQuestions(nextQuestionIds.map((id) => questionsById.get(id) ?? ""));
  }

  function replaceQuestions(nextQuestions: string[]) {
    const nextQuestionIds = nextQuestions.map(() => ulid());

    setQuestionIds(nextQuestionIds);
    setQuestions(nextQuestions);
    setGeneratedQuestionIds(new Set(nextQuestionIds));

    if (generatedQuestionTimeoutRef.current) {
      clearTimeout(generatedQuestionTimeoutRef.current);
    }

    generatedQuestionTimeoutRef.current = setTimeout(() => {
      setGeneratedQuestionIds(new Set());
    }, 1200);
  }

  function generateQuestions() {
    generateQuestionsMutation.mutate({
      jobDescription,
      locale,
    });
  }

  function handleGenerateClick() {
    if (questions.some((question) => question.trim())) {
      setIsReplaceDialogOpen(true);
      return;
    }

    generateQuestions();
  }

  function handleConfirmReplace() {
    setIsReplaceDialogOpen(false);
    generateQuestions();
  }

  const questionCountLabel = t("count", { count: questions.length });
  const isGenerating = generateQuestionsMutation.isPending;
  const generationError = generateQuestionsMutation.isError
    ? t("generation.error")
    : null;

  return (
    <DialogContent
      className="max-h-[min(86vh,680px)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
      showCloseButton={false}
    >
      <DialogHeader className="relative border-b px-5 py-4 pr-12">
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
        <DialogClose asChild>
          <Button
            aria-label={t("closeAria")}
            className="absolute top-3 right-3"
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </DialogClose>
      </DialogHeader>

      <div className="max-h-[min(60vh,460px)] overflow-y-auto">
        <QuestionGenerationSection
          error={generationError}
          isGenerating={isGenerating}
          jobDescription={jobDescription}
          onGenerate={handleGenerateClick}
          onJobDescriptionChange={setJobDescription}
        />

        <Separator />

        <div className="px-4 py-5 flex flex-col gap-4">
          <Reorder.Group
            as="div"
            axis="y"
            className="flex flex-col gap-2"
            onReorder={handleReorder}
            values={questionIds}
          >
            {isGenerating ? (
              <GeneratingQuestionPlaceholders />
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                {questions.map((question, index) => {
                  const id = questionIds[index] ?? `${index}`;

                  return (
                    <QuestionRow
                      canDelete={questions.length > 1}
                      id={id}
                      index={index}
                      key={id}
                      reorderValue={id}
                      staggerIndex={
                        generatedQuestionIds.has(id) ? index : undefined
                      }
                      onChange={(value) => handleQuestionChange(index, value)}
                      onDelete={() => handleDeleteQuestion(index)}
                      ref={setTextareaRef(id)}
                      value={question}
                    />
                  );
                })}
              </AnimatePresence>
            )}
          </Reorder.Group>

          <Button
            className="w-fit rounded-full px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleAddQuestion}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("addQuestion")}
          </Button>
        </div>
      </div>

      <DialogFooter className="flex-row items-center justify-between gap-3 bg-background px-5 py-4 sm:justify-between m-0">
        <p className="text-muted-foreground text-sm">{questionCountLabel}</p>
        <DialogClose asChild>
          <Button className="rounded-full px-4" type="button">
            {t("done")}
          </Button>
        </DialogClose>
      </DialogFooter>

      <ReplaceQuestionsDialog
        isGenerating={isGenerating}
        onConfirm={handleConfirmReplace}
        onOpenChange={setIsReplaceDialogOpen}
        open={isReplaceDialogOpen}
      />
    </DialogContent>
  );
}

type QuestionGenerationSectionProps = {
  jobDescription: string;
  isGenerating: boolean;
  error: string | null;
  onJobDescriptionChange: (value: string) => void;
  onGenerate: () => void;
};

function QuestionGenerationSection({
  jobDescription,
  isGenerating,
  error,
  onJobDescriptionChange,
  onGenerate,
}: QuestionGenerationSectionProps) {
  const t = useTranslations("EditQuestions.generation");

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <p className="text-muted-foreground text-sm">{t("helper")}</p>
      <AutoSizeTextarea
        className="min-h-28 resize-none border-border/60 bg-background/70 focus-visible:ring-2 focus-visible:ring-ring/20"
        disabled={isGenerating}
        onChange={(event) => onJobDescriptionChange(event.target.value)}
        placeholder={t("placeholder")}
        rows={4}
        value={jobDescription}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("replaceHint")}
          </span>
        )}
        <Button
          data-icon="inline-start"
          disabled={isGenerating}
          onClick={onGenerate}
          size="sm"
          type="button"
          variant="outline"
        >
          {isGenerating ? (
            <>
              <LoaderCircleIcon className="animate-spin" />
              {t("loading")}
            </>
          ) : (
            <>
              <SparkleIcon />
              {t("generate")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function GeneratingQuestionPlaceholders() {
  return (
    <>
      {questionPlaceholderRows.map((placeholderRow) => (
        <div
          className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-3"
          key={placeholderRow}
        >
          <Skeleton className="size-4 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-7/12" />
          </div>
          <Skeleton className="size-7 rounded-lg" />
        </div>
      ))}
    </>
  );
}

type ReplaceQuestionsDialogProps = {
  open: boolean;
  isGenerating: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

function ReplaceQuestionsDialog({
  open,
  isGenerating,
  onOpenChange,
  onConfirm,
}: ReplaceQuestionsDialogProps) {
  const t = useTranslations("EditQuestions.replace");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-background">
          <Button
            disabled={isGenerating}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t("cancel")}
          </Button>
          <Button disabled={isGenerating} onClick={onConfirm} type="button">
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type QuestionRowProps = {
  id: string;
  index: number;
  value: string;
  reorderValue: string;
  staggerIndex?: number;
  canDelete: boolean;
  onChange: (value: string) => void;
  onDelete: () => void;
  ref: (element: HTMLTextAreaElement | null) => void;
};

function QuestionRow({
  id,
  index,
  value,
  reorderValue,
  staggerIndex,
  canDelete,
  onChange,
  onDelete,
  ref,
}: QuestionRowProps) {
  const t = useTranslations("EditQuestions.row");
  const dragControls = useDragControls();
  const questionNumber = index + 1;

  return (
    <Reorder.Item
      as="div"
      value={reorderValue}
      dragListener={false}
      dragControls={dragControls}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.16,
        ease: "easeOut",
        delay: staggerIndex === undefined ? 0 : staggerIndex * 0.035,
        layout: { duration: 0.18, ease: "easeOut" },
      }}
      className="group flex items-start gap-2 rounded-xl border border-border/70 bg-background/70 px-2.5 py-2 transition-colors duration-150 hover:bg-muted/35 focus-within:border-ring/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/15"
    >
      <button
        aria-label={t("reorderAria", { index: questionNumber })}
        className="mt-1.5 cursor-grab rounded-md p-0.5 text-muted-foreground/35 transition-colors active:cursor-grabbing group-hover:text-muted-foreground/60"
        onPointerDown={(event) => dragControls.start(event)}
        type="button"
      >
        <GripVerticalIcon aria-hidden="true" className="size-4" />
      </button>
      <AutoSizeTextarea
        aria-label={t("label", { index: questionNumber })}
        className="min-h-9 flex-1 resize-none border-0 bg-transparent px-2.5 py-1.5 shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0"
        id={`interview-question-${id}`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("placeholder")}
        ref={ref}
        rows={1}
        value={value}
      />
      <Button
        aria-label={t("deleteAria", { index: questionNumber })}
        className="mt-0.5 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100"
        disabled={!canDelete}
        onClick={onDelete}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Trash2Icon />
      </Button>
    </Reorder.Item>
  );
}

function AutoSizeTextarea({
  className,
  onInput,
  ref,
  value,
  ...props
}: ComponentProps<typeof Textarea>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    resizeTextarea();
  });

  const setRef = useCallback(
    (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;

      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    },
    [ref],
  );

  return (
    <Textarea
      className={cn("overflow-hidden", className)}
      onInput={(event) => {
        resizeTextarea();
        onInput?.(event);
      }}
      ref={setRef}
      value={value}
      {...props}
    />
  );
}
