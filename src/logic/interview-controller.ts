import {
  getInterviewDefault,
  interviewAtom,
  interviewRuntimeAtom,
  previousInterviewAtom,
  store,
} from "@/logic/atoms";
import { initUserInputDevice, useInitPreview } from "@/logic/media";
import { useSetResponseBlobMutation } from "@/logic/storage/queries";
import type { InterviewConfig, Response } from "@/logic/types";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ulid } from "ulid";

type InterviewController = {
  startInterview: (x: InterviewConfig) => Promise<void>;
  endResponse: () => void;
  endInterviewEarly: () => void;
};
type RecordingSession = {
  questionId: string;
  responseId: string;
};

export function useInterviewController(): InterviewController {
  const { initPreview } = useInitPreview();
  const mediaRecorderRef = useRef<MediaRecorder | undefined>(undefined);
  const setResponseBlobMutation = useSetResponseBlobMutation();
  const recordingSessionRef = useRef<RecordingSession | undefined>(undefined);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);
  const phaseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const router = useRouter();

  async function startRecordingSession(questionId: string) {
    recordingSessionRef.current = {
      questionId,
      responseId: ulid(),
    };
    await startMediaRecorder();
  }

  async function persistRecordingSession({
    blob,
    responseId,
    questionId,
  }: { blob: Blob } & RecordingSession) {
    const response: Response = {
      id: responseId,
      createdAt: new Date(),
    };

    try {
      await setResponseBlobMutation.mutateAsync({
        responseId: response.id,
        blob,
      });
      store.set(interviewAtom, (interview) => ({
        ...interview,
        responses: {
          ...interview.responses,
          [questionId]: [...(interview.responses[questionId] || []), response],
        },
      }));
    } catch (error) {
      toast.error("Failed to save response");
    } finally {
      recordingSessionRef.current = undefined;
    }
  }

  function cleanupStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = undefined;
    }
  }

  function initMediaRecorder(stream: MediaStream) {
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.addEventListener("dataavailable", async (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    });

    mediaRecorderRef.current = mediaRecorder;
  }

  async function startMediaRecorder() {
    return new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve();
        return;
      }

      const handleStart = () => {
        resolve();
        mediaRecorderRef.current?.removeEventListener("start", handleStart);
      };

      if (mediaRecorderRef.current?.state !== "inactive") {
        resolve();
        return;
      } else {
        mediaRecorderRef.current?.addEventListener("start", handleStart);
        mediaRecorderRef.current?.start();
      }
    });
  }

  /**
   * Recording persistence is intentionally awaited before advancing phases
   * to guarantee deterministic interview ordering.
   */
  async function stopMediaRecorder() {
    return new Promise<void>((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder) {
        resolve();
        return;
      }

      const handleStop = async () => {
        try {
          if (!recordingSessionRef.current) {
            resolve();
            return;
          }

          const chunks = chunksRef.current;
          chunksRef.current = [];

          const blob = new Blob(chunks);

          const { questionId, responseId } = recordingSessionRef.current;

          await persistRecordingSession({
            blob,
            responseId,
            questionId,
          });

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          mediaRecorder.removeEventListener("stop", handleStop);
        }
      };

      if (mediaRecorder.state === "inactive") {
        resolve();
        return;
      } else {
        mediaRecorder.addEventListener("stop", handleStop);
        mediaRecorder.stop();
      }
    });
  }

  async function startInterview({
    questions,
    countdownDuration,
    questionDuration,
    isRetaking,
    retakeQuestionIndex,
    responses,
  }: InterviewConfig) {
    // Init recording lifecycle
    streamRef.current = await initUserInputDevice();
    await initPreview(streamRef.current);
    initMediaRecorder(streamRef.current);

    store.set(interviewAtom, {
      currentQuestionIndex: isRetaking ? retakeQuestionIndex : 0,
      countdownDuration,
      questionDuration,
      questions,
      isRetaking,
      responses,
    });
    store.set(interviewRuntimeAtom, {
      phase: "countdown",
      phaseStartedAt: Date.now(),
    });
    schedulePhaseTransition(countdownDuration * 1000);
  }

  function schedulePhaseTransition(durationMs: number) {
    clearScheduledTransition();

    phaseTimeoutRef.current = setTimeout(() => {
      advanceInterviewPhase();
    }, durationMs);
  }
  function clearScheduledTransition() {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }
  }

  async function advanceInterviewPhase() {
    const interviewRuntime = store.get(interviewRuntimeAtom);
    const interview = store.get(interviewAtom);

    switch (interviewRuntime.phase) {
      case "countdown": {
        await startRecordingSession(
          interview.questions[interview.currentQuestionIndex].id,
        );
        store.set(interviewRuntimeAtom, {
          phase: "question",
          phaseStartedAt: Date.now(),
        });
        schedulePhaseTransition(interview.questionDuration * 1000);
        break;
      }
      case "question": {
        await stopMediaRecorder();

        const currentQuestionIndex =
          store.get(interviewAtom).currentQuestionIndex;

        if (
          currentQuestionIndex + 1 >= interview.questions.length ||
          interview.isRetaking
        ) {
          await endInterview();
        } else {
          store.set(interviewRuntimeAtom, (interviewRuntime) => ({
            ...interviewRuntime,
            phase: "countdown",
            phaseStartedAt: Date.now(),
          }));
          // Advance to the next question
          store.set(interviewAtom, (interview) => ({
            ...interview,
            currentQuestionIndex: interview.currentQuestionIndex + 1,
          }));
          schedulePhaseTransition(interview.countdownDuration * 1000);
        }
        break;
      }
    }
  }

  function cleanup() {
    clearScheduledTransition();
    cleanupStream();
  }

  // Cleanup the interview when the component unmounts
  useEffect(
    () => () => {
      cleanup();
    },
    [],
  );

  function resetInterview() {
    cleanup();

    store.set(interviewRuntimeAtom, {
      phase: "preparing",
    });
    store.set(previousInterviewAtom, store.get(interviewAtom));
    store.set(interviewAtom, getInterviewDefault());
  }

  async function endInterview() {
    resetInterview();
    router.push("/review");
  }

  async function endResponse() {
    clearScheduledTransition();
    advanceInterviewPhase();
  }

  async function endInterviewEarly() {
    clearScheduledTransition();
    await stopMediaRecorder();
    endInterview();
  }

  return {
    startInterview,
    endResponse,
    endInterviewEarly,
  };
}
