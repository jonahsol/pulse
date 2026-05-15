"use client";

import { PulseLogoDot } from "@/app/[locale]/(root)/pulse-logo";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookmarkIcon, CaptionsIcon, PlayIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";

type State = "question" | "countdown" | "recording" | "review";

export function MockUI() {
  const router = useRouter();
  const t = useTranslations("MockUI");

  const [state, setState] = useState<State>("question");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const runDemo = () => {
      setState("question");
      setCountdown(5);

      // Show question for 2s
      setTimeout(() => {
        setState("countdown");
        let count = 5;
        const interval = setInterval(() => {
          count--;
          setCountdown(count);
          if (count === 0) {
            clearInterval(interval);
            setState("recording");
            // Recording for 3s
            setTimeout(() => {
              setState("review");
              // Review for 3s, then restart
              setTimeout(() => {
                runDemo();
              }, 3000);
            }, 3000);
          }
        }, 800);
      }, 2000);
    };

    runDemo();
  }, []);

  return (
    <Tooltip>
      <TooltipContent side="bottom">
        <div className="flex items-center gap-2">
          <PulseLogoDot />
          <div>{t("tooltip")}</div>
        </div>
      </TooltipContent>
      <TooltipTrigger asChild>
        <button
          className="relative h-[182px] rounded-2xl border p-2 md:rounded-3xl md:p-3 cursor-pointer"
          onClick={() => {
            router.push("/practice");
          }}
          type="button"
        >
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <div className="border-0.75 relative flex h-full flex-col justify-center gap-6 overflow-hidden rounded-xl p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
            <AnimatePresence mode="wait">
              {state === "question" && (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 flex flex-col items-center justify-center"
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("question.label")}
                  </p>
                  <p className="text-balance text-foreground">
                    {t("question.prompt")}
                  </p>
                </motion.div>
              )}

              {state === "countdown" && (
                <motion.div
                  key="countdown"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-4"
                >
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {t("countdown.startingIn")}
                  </p>
                  <motion.span
                    key={countdown}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-5xl font-light tabular-nums text-foreground"
                  >
                    {countdown}
                  </motion.span>
                </motion.div>
              )}

              {state === "recording" && (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex justify-center"
                >
                  <div className="aspect-video h-full p-8 rounded bg-muted/50 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="inline-block h-2.5 w-2.5 rounded-full bg-red-500"
                      />
                      <span className="text-sm uppercase tracking-wider text-muted-foreground">
                        {t("recording.label")}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {state === "review" && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 pointer-events-none w-[77%] self-center"
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("review.label")}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 rounded border border-border bg-muted/30 p-3">
                    <div className="h-10 w-14 rounded bg-muted flex items-center justify-center shrink-0">
                      <PlayIcon className="text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">
                        {t("review.attempt")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("review.duration")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" data-icon="inline-start">
                        <CaptionsIcon /> {t("review.transcript")}
                      </Button>
                      <Button variant="outline" data-icon="inline-start">
                        <BookmarkIcon />
                        {t("review.save")}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </button>
      </TooltipTrigger>
    </Tooltip>
  );
}

const Stars = () => {
  const randomMove = () => Math.random() * 4 - 2;
  const randomOpacity = () => Math.random();
  const random = () => Math.random();
  const starIds = Array.from({ length: 80 }, (_, index) => `star-${index}`);
  return (
    <div className="absolute inset-0">
      {starIds.map((starId) => (
        <motion.span
          key={starId}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 10 + 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            backgroundColor: "white",
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block"
        ></motion.span>
      ))}
    </div>
  );
};

export const MemoizedStars = memo(Stars);
