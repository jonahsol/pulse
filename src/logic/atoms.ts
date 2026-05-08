import type { InterviewState, QuestionResponse } from "@/logic/types";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

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

export const currentInterviewAtom = atom<InterviewState>({
  phase: "preparing",
  currentQuestionIndex: 0,
  questions: [],
  countdownTime: 0,
  countdownDuration: 0,
  questionTime: 0,
  questionDuration: 0,
  endedEarly: false,
  isRetaking: false,
});
export const previousInterviewAtom = atom<InterviewState | undefined>(
  undefined,
);
export const endedEarlyAtom = atom<boolean>(false);

export const responsesAtom = atom<Record<string, QuestionResponse[]>>({});
