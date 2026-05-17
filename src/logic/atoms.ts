import type { Interview, InterviewRuntime, SavedTake } from "@/logic/types";
import { atom, getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const store = getDefaultStore();

// Input
export const countdownDurationConfigAtom = atomWithStorage<number>(
  "countdownDurationConfig",
  5,
);
export const responseDurationConfigAtom = atomWithStorage<number>(
  "responseDurationConfig",
  60,
);
export const questionsConfigAtom = atomWithStorage<string[]>(
  "questionsConfig",
  [
    "Tell me about yourself and the kind of work that energizes you.",
    "Describe a challenging project you owned and how you handled trade-offs.",
    "Describe a time you had to deliver a project on a very tight deadline.",
    "Why are you interested in this role, and what would you want to accomplish first?",
  ],
);

export const getInterviewDefault = () =>
  ({
    currentQuestionIndex: 0,
    questions: [],
    countdownDuration: 0,
    questionDuration: 0,
    isRetaking: false,
    responses: {},
  }) satisfies Interview;
export const getResponsesDefault = () => ({});

// Runtime state is ephemeral and shouldn't be persisted in local storage —
// persisting leads to race conditions and other bugs if the user opens more
// than one tab.
export const interviewRuntimeAtom = atom<InterviewRuntime>({
  phase: "preparing",
});

export const interviewAtom = atomWithStorage<Interview>(
  "interview",
  getInterviewDefault(),
);
export const previousInterviewAtom = atomWithStorage<Interview | undefined>(
  "previousInterview",
  undefined,
);

export const isProcessingResponseAtom = atom(false);

export const savedTakesAtom = atomWithStorage<SavedTake[]>("savedTakes", []);
