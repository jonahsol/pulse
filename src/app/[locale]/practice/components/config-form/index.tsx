import { EditCountdownDurationButton } from "@/app/[locale]/practice/components/config-form/edit-countdown-duration-button";
import { EditQuestionsButton } from "@/app/[locale]/practice/components/config-form/edit-questions-button";
import { EditResponseDurationButton } from "@/app/[locale]/practice/components/config-form/edit-response-duration-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientOnly } from "@/components/utils/client-only";
import { cn } from "@/lib/utils";
import {
  countdownDurationConfigAtom,
  questionsConfigAtom,
  responseDurationConfigAtom,
} from "@/logic/atoms";
import { AnimatePresence, motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ulid } from "ulid";

export function InterviewConfigForm() {
  const t = useTranslations("InterviewConfig");
  const countdownDurationInput = useAtomValue(countdownDurationConfigAtom);
  const responseDurationInput = useAtomValue(responseDurationConfigAtom);
  const questionsInput = useAtomValue(questionsConfigAtom);

  return (
    <div className="grid w-full grid-cols-3 gap-3 text-sm">
      <Card>
        <CardContent>
          <CardTitle>{t("countdownDuration.label")}</CardTitle>
          {/* Client-only since the value is from local storage */}
          <ClientOnlySkeleton>
            <AnimatedP animateKey={countdownDurationInput.toString()}>
              {countdownDurationInput}s
            </AnimatedP>
          </ClientOnlySkeleton>
        </CardContent>
        <EditCountdownDurationButton className="-mt-2 -mr-2" />
      </Card>

      <Card>
        <CardContent>
          <CardTitle>{t("responseDuration.label")}</CardTitle>
          {/* Client-only since the value is from local storage */}
          <ClientOnlySkeleton>
            <AnimatedP animateKey={responseDurationInput.toString()}>
              {responseDurationInput}s
            </AnimatedP>
          </ClientOnlySkeleton>
        </CardContent>
        <EditResponseDurationButton className="-mt-2 -mr-2" />
      </Card>

      <Card>
        <CardContent>
          <CardTitle>{t("questions.label")}</CardTitle>
          {/* Client-only since the value is from local storage */}
          <ClientOnlySkeleton>
            <AnimatedP animateKey={questionsInput[0]} className="truncate">
              1. {questionsInput[0]}
            </AnimatedP>
          </ClientOnlySkeleton>
        </CardContent>
        <EditQuestionsButton className="-mt-2 -mr-2" />
      </Card>
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative bg-muted/40 rounded-xl border border-border/60 px-4 py-3 flex justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground text-xs tracking-wide uppercase">
      {children}
    </div>
  );
}

function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>;
}

function ClientOnlySkeleton({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly skeleton={<Skeleton className="h-[1.25rem] w-[3ch]" />}>
      {children}
    </ClientOnly>
  );
}

type AnimatedPProps = {
  children: React.ReactNode;
  animateKey: string;
  className?: string;
};
export function AnimatedP({ children, animateKey, className }: AnimatedPProps) {
  const id = useMemo(() => ulid(), []);

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.p
        key={`${id}-${animateKey}`}
        initial={{
          y: 8,
          opacity: 0,
          filter: "blur(4px)",
        }}
        animate={{
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
        }}
        exit={{
          y: -8,
          opacity: 0,
          filter: "blur(4px)",
        }}
        transition={{
          duration: 0.18,
          ease: "easeOut",
        }}
        className={cn("font-semibold tabular-nums", className)}
      >
        {children}
      </motion.p>
    </AnimatePresence>
  );
}
