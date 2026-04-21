"use client";

import { Button } from "@/components/ui/button";
import {
  IconBookmark,
  IconPlayerPlay,
  IconSubtitlesAi,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type State = "question" | "countdown" | "recording" | "review";

export function MockUI() {
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
    <div className="w-full h-[182px] rounded-lg border border-border bg-card p-6 flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {state === "question" && (
          <motion.div
            key="question"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Question
            </p>
            <p className="text-balance text-foreground">
              Tell me about a time you had to make a decision with incomplete
              information.
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
              Starting in
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
                  Recording
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
              Review
            </p>
            <div className="flex items-center gap-3 rounded border border-border bg-muted/30 p-3">
              <div className="h-10 w-14 rounded bg-muted flex items-center justify-center">
                <IconPlayerPlay className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium">Attempt 1</p>
                <p className="text-xs text-muted-foreground">0:42</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" data-icon="inline-start">
                  <IconSubtitlesAi /> Transcript
                </Button>
                <Button variant="outline" data-icon="inline-start">
                  <IconBookmark />
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
