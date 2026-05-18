import {
  countdownDurationConfigAtom,
  questionsConfigAtom,
  responseDurationConfigAtom,
  store,
} from "@/logic/atoms";
import { InterviewConfig } from "@/logic/types";
import { ulid } from "ulid";

export function getInterviewConfigFromAtomState(): InterviewConfig {
  const questionsInput = store.get(questionsConfigAtom);
  const countdownDurationInput = store.get(countdownDurationConfigAtom);
  const responseDurationInput = store.get(responseDurationConfigAtom);

  return {
    questions: questionsInput.map((prompt, index) => ({
      id: ulid(),
      prompt,
      index,
    })),
    countdownDuration: countdownDurationInput,
    questionDuration: responseDurationInput,
    isRetaking: false,
    responses: {},
  };
}
