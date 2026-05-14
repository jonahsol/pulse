import {
  countdownDurationConfigAtom,
  currentInterviewAtom,
  getInterviewDefault,
  isProcessingResponseAtom,
  previousInterviewAtom,
  questionsConfigAtom,
  responseDurationConfigAtom,
} from "@/logic/atoms";
import { useInterviewRuntimeContext } from "@/logic/context";
import {
  initUserInputDevice,
  useInitPreview,
  useMediaRecorder,
} from "@/logic/media";
import { useSetResponseBlobMutation } from "@/logic/storage/queries";
import { InterviewState, Question, Response } from "@/logic/types";
import { useInterval } from "@/logic/use-interval";
import {
  atom,
  getDefaultStore,
  useAtom,
  useAtomValue,
  useSetAtom,
} from "jotai";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ulid } from "ulid";

type RetakeInterviewConfig =
  | {
      isRetaking: true;
      retakeQuestionIndex: number;
    }
  | {
      isRetaking: false;
      retakeQuestionIndex?: undefined;
    };
export type InterviewConfig = {
  questions: Question[];
  countdownDuration: number;
  questionDuration: number;
  responses: Record<string, Response[]>;
} & RetakeInterviewConfig;

/**
 * `useInterview` manages the interview runtime state and logic, as well as
 * emitting any side-effects. It is the main hook for the interview component.
 */
export const interviewCompleteAtom = atom<boolean>(
  (get) => get(currentInterviewAtom).phase === "complete",
);
type InterviewRuntime = {
  startInterview: (x: InterviewConfig) => Promise<void>;
  togglePauseInterview: () => void;
  isPaused: boolean;
  endResponse: () => void;
  endInterviewEarly: () => void;
};

export function useInterviewRuntime(): InterviewRuntime {
  const setCurrentInterview = useSetAtom(currentInterviewAtom);
  const setPreviousInterview = useSetAtom(previousInterviewAtom);

  // Hooks for controlling the interview lifecycle state
  const { computeNextState } = useInterviewStateUpdater();
  const handleTick = useCallback(() => {
    // Compute the next state
    setCurrentInterview((interview) => computeNextState(interview));
  }, [computeNextState, setCurrentInterview]);
  const { startTicker, togglePause, isPaused } = useInterviewTicker({
    onTick: handleTick,
  });

  // Hooks for controlling the interview media recording
  const { initPreview } = useInitPreview();
  const { initMediaRecorder, mediaRecorder, isRecording } = useMediaRecorder();
  useInterviewPhaseMediaRecorder(mediaRecorder);
  const isProcessingResponse = useAtomValue(isProcessingResponseAtom);

  // Start the interview: request media recording, set initial state, and start
  // the ticker
  const startInterview: (x: InterviewConfig) => Promise<void> = useCallback(
    async ({
      questions,
      countdownDuration,
      questionDuration,
      isRetaking,
      retakeQuestionIndex,
      responses,
    }: InterviewConfig) => {
      // Set interview starting state based on the interview config
      setCurrentInterview({
        phase: "countdown",
        currentQuestionIndex: isRetaking ? retakeQuestionIndex : 0,
        countdownTime: 0,
        questionTime: 0,
        endedEarly: false,
        countdownDuration,
        questionDuration,
        questions,
        isRetaking,
        responses,
      });

      // Init recording lifecycle
      const stream = await initUserInputDevice();
      await initPreview(stream);
      initMediaRecorder(stream);

      // Start interview ticker
      startTicker();
    },
    [
      initMediaRecorder,
      initPreview,
      initUserInputDevice,
      setCurrentInterview,
      startTicker,
    ],
  );

  const endInterviewEarly = useCallback(() => {
    setCurrentInterview((interview) => ({
      ...interview,
      phase: "complete",
    }));
  }, [setCurrentInterview]);

  const endResponse = useCallback(() => {
    setCurrentInterview((interview) => ({
      ...interview,
      questionTime: interview.questionDuration,
    }));
  }, [setCurrentInterview]);

  // End the interview when `interview.phase` is `complete`
  const interviewComplete = useAtomValue(interviewCompleteAtom);
  const router = useRouter();
  useEffect(() => {
    if (interviewComplete && !isRecording && !isProcessingResponse) {
      setPreviousInterview(getDefaultStore().get(currentInterviewAtom));
      // Reset the current interview state
      setCurrentInterview(getInterviewDefault());
      router.push("/review");
    }
  }, [
    interviewComplete,
    router,
    setCurrentInterview,
    setPreviousInterview,
    isRecording,
    isProcessingResponse,
  ]);

  return {
    startInterview,
    togglePauseInterview: togglePause,
    isPaused,
    endResponse,
    endInterviewEarly,
  };
}

/**
 * `useInterviewTicker` hook advances the interview state by 1 second every second.
 */
function useInterviewTicker({ onTick }: { onTick: () => void }) {
  const [ticking, setTicking] = useState(false);
  const [interview, setInterview] = useAtom(currentInterviewAtom);

  const handleTick = useCallback(() => {
    // If the interview is in the countdown phase, increment the countdown time
    if (interview.phase === "countdown") {
      setInterview((interview) => ({
        ...interview,
        countdownTime: interview.countdownTime + 1,
      }));
      // If the interview is in the question phase, increment the question time
    } else if (interview.phase === "question") {
      setInterview((interview) => ({
        ...interview,
        questionTime: interview.questionTime + 1,
      }));
    }

    // Call the onTick callback
    onTick();
  }, [interview, setInterview, onTick]);

  const intervalCallback = useCallback(() => {
    if (ticking) {
      handleTick();
    }
  }, [ticking, handleTick]);
  useInterval(intervalCallback, 1000);

  const togglePause = () => {
    setTicking((shouldTick) => !shouldTick);
  };
  const startTicker = () => {
    setTicking(true);
  };

  return {
    isPaused: !ticking,
    togglePause,
    startTicker,
  };
}

/**
 * `useInterviewStateMachine` hook updates the state of the interview based on
 * the current state and the elapsed time.
 */
function useInterviewStateUpdater() {
  const computeNextState = useCallback(
    (interview: InterviewState): InterviewState => {
      // Check if countdown is over
      if (
        interview.phase === "countdown" &&
        interview.countdownTime >= interview.countdownDuration
      ) {
        return {
          ...interview,
          countdownTime: 0,
          phase: "question",
        };
      } else if (
        // Check if question is over
        interview.phase === "question" &&
        interview.questionTime >= interview.questionDuration
      ) {
        // If there are more questions, go to the next question
        return {
          ...interview,
          currentQuestionIndex: interview.currentQuestionIndex + 1,
          questionTime: 0,
          phase:
            interview.isRetaking ||
            interview.currentQuestionIndex + 1 >= interview.questions.length
              ? "complete"
              : "countdown",
        };
      }

      return interview;
    },
    [],
  );

  return {
    computeNextState,
  };
}

const interviewPhaseAtom = atom((get) => get(currentInterviewAtom).phase);

/**
 * `useInterviewMediaRecorderController` hook controls the media recorder based
 * on the interview phase. It starts recording when the interview phase is "question"
 * and stops recording when the interview phase is "countdown" or "complete".
 */
function useInterviewPhaseMediaRecorder(mediaRecorder: MediaRecorder | null) {
  const interviewPhase = useAtomValue(interviewPhaseAtom);
  const currentInterview = useAtomValue(currentInterviewAtom);
  const setCurrentInterview = useSetAtom(currentInterviewAtom);

  const setResponseBlobMutation = useSetResponseBlobMutation();

  // Media recorder input commands: Start / stop recording based on the
  // interview phase.
  useEffect(() => {
    if (!mediaRecorder) return;

    if (interviewPhase === "question" && mediaRecorder.state !== "recording") {
      mediaRecorder.start();
    } else if (
      (interviewPhase === "countdown" || interviewPhase === "complete") &&
      mediaRecorder.state === "recording"
    ) {
      mediaRecorder.stop();
    }
  }, [interviewPhase, mediaRecorder]);

  // Media recorder event handler: Save the media recording to the responses
  // atom.
  useEffect(() => {
    if (!mediaRecorder) return;

    const handler = async (event: BlobEvent) => {
      if (event.data.size > 0) {
        const store = getDefaultStore();
        store.set(isProcessingResponseAtom, true);
        // Media recorder was stopped AFTER the previous question, so we need
        // to use the previous question index
        const questionId =
          currentInterview.questions[currentInterview.currentQuestionIndex - 1]
            .id;
        const response: Response = {
          id: ulid(),
          createdAt: new Date(),
        };

        try {
          await setResponseBlobMutation.mutateAsync({
            responseId: response.id,
            blob: event.data,
          });
          setCurrentInterview((interview) => ({
            ...interview,
            responses: {
              ...interview.responses,
              [questionId]: [
                ...(interview.responses[questionId] || []),
                response,
              ],
            },
          }));
        } catch (error) {
          toast.error("Failed to save response");
        } finally {
          store.set(isProcessingResponseAtom, false);
        }
      }
    };

    mediaRecorder.addEventListener("dataavailable", handler);

    return () => {
      mediaRecorder.removeEventListener("dataavailable", handler);
    };
  }, [
    mediaRecorder,
    currentInterview,
    setCurrentInterview,
    setResponseBlobMutation.mutateAsync,
  ]);
}

export function useAddTake() {
  const interviewRuntime = useInterviewRuntimeContext();
  const router = useRouter();

  const addTake = useCallback(
    (interview: InterviewState, questionIndex: number) => {
      interviewRuntime.startInterview({
        ...interview,
        isRetaking: true,
        retakeQuestionIndex: questionIndex,
      });
      router.push("/practice");
    },
    [interviewRuntime.startInterview, router],
  );

  return { addTake };
}

export function getInterviewConfigFromAtomState(): InterviewConfig {
  const questionsInput = getDefaultStore().get(questionsConfigAtom);
  const countdownDurationInput = getDefaultStore().get(
    countdownDurationConfigAtom,
  );
  const responseDurationInput = getDefaultStore().get(
    responseDurationConfigAtom,
  );

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
