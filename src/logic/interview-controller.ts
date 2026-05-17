import {
  getInterviewDefault,
  interviewAtom,
  interviewRuntimeAtom,
  previousInterviewAtom,
  store,
} from "@/logic/atoms";
import { InterviewConfig } from "@/logic/interview";
import { initUserInputDevice, useInitPreview } from "@/logic/media";
import { useSetResponseBlobMutation } from "@/logic/storage/queries";
import type { Response } from "@/logic/types";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ulid } from "ulid";

type InterviewController = {
  startInterview: (x: InterviewConfig) => Promise<void>;
  togglePause: () => void;
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
      mediaRecorderRef.current?.addEventListener("start", handleStart);
      mediaRecorderRef.current?.start();
    });
  }
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

          const blob = new Blob(chunksRef.current);
          chunksRef.current = [];

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

      mediaRecorder.addEventListener("stop", handleStop);

      mediaRecorder.stop();
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
      paused: false,
      pauseStartedAt: null,
      totalPauseTime: 0,
    });
    startPhaseTimeout(countdownDuration * 1000);
  }

  function startPhaseTimeout(durationMs: number) {
    clearPhaseTimeout();

    phaseTimeoutRef.current = setTimeout(() => {
      handlePhaseTimeoutEnd();
    }, durationMs);
  }
  function clearPhaseTimeout() {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }
  }

  async function handlePhaseTimeoutEnd() {
    const interviewRuntime = store.get(interviewRuntimeAtom);
    const interview = store.get(interviewAtom);

    switch (interviewRuntime.phase) {
      case "countdown":
        if (
          (Date.now() - interviewRuntime.phaseStartedAt) / 1000 >=
          interview.countdownDuration
        ) {
          // Countdown is over — start the question

          await startRecordingSession(
            interview.questions[interview.currentQuestionIndex].id,
          );
          store.set(interviewRuntimeAtom, {
            phase: "question",
            phaseStartedAt: Date.now(),
            paused: false,
            pauseStartedAt: null,
            totalPauseTime: 0,
          });
          startPhaseTimeout(interview.questionDuration * 1000);
        }
        return;

      case "question":
        if (
          (Date.now() - interviewRuntime.phaseStartedAt) / 1000 >=
          interview.questionDuration
        ) {
          // Question is over — cleanup and start the countdown

          await stopMediaRecorder();

          const currentQuestionIndex =
            store.get(interviewAtom).currentQuestionIndex;

          if (currentQuestionIndex + 1 >= interview.questions.length) {
            await endInterview();
          } else {
            store.set(interviewRuntimeAtom, (interviewRuntime) => ({
              ...interviewRuntime,
              phase: "countdown",
              phaseStartedAt: Date.now(),
              paused: false,
              pauseStartedAt: null,
              totalPauseTime: 0,
            }));
            // Advance to the next question
            store.set(interviewAtom, (interview) => ({
              ...interview,
              currentQuestionIndex: interview.currentQuestionIndex + 1,
            }));
            startPhaseTimeout(interview.countdownDuration * 1000);
          }
        }
        break;
    }
  }

  function togglePause() {
    const interviewRuntime = store.get(interviewRuntimeAtom);
    if (interviewRuntime.phase === "preparing") return;
    else if (interviewRuntime.paused) endPause();
    else startPause();
  }
  function startPause() {
    clearPhaseTimeout();
    store.set(interviewRuntimeAtom, (interviewRuntime) => {
      if (interviewRuntime.phase === "preparing") return interviewRuntime;
      else
        return {
          ...interviewRuntime,
          paused: true,
          pauseStartedAt: Date.now(),
        };
    });
  }
  function endPause() {
    const interview = store.get(interviewAtom);
    const interviewRuntime = store.get(interviewRuntimeAtom);
    const now = Date.now();

    if (
      interviewRuntime.phase === "preparing" ||
      !interviewRuntime.pauseStartedAt
    )
      return;

    const phaseDuration =
      interviewRuntime.phase === "countdown"
        ? interview.countdownDuration
        : interview.questionDuration;
    const phaseTimeUsed = now - interviewRuntime.phaseStartedAt;
    const pauseDuration = now - interviewRuntime.pauseStartedAt;

    startPhaseTimeout(
      // Phase duration - time already used - duration of this pause - duration of previous pauses
      phaseDuration * 1000 -
        phaseTimeUsed -
        pauseDuration -
        interviewRuntime.totalPauseTime,
    );

    store.set(interviewRuntimeAtom, (interviewRuntime) => {
      if (
        interviewRuntime.phase === "preparing" ||
        !interviewRuntime.pauseStartedAt
      )
        return interviewRuntime;
      else
        return {
          ...interviewRuntime,
          paused: false,
          pauseStartedAt: null,
          totalPauseTime:
            interviewRuntime.totalPauseTime +
            (now - interviewRuntime.pauseStartedAt),
        };
    });
  }

  function cleanup() {
    clearPhaseTimeout();
    cleanupStream();
  }

  useEffect(
    () => () => {
      cleanup();
    },
    [],
  );

  async function endInterview() {
    cleanup();

    store.set(previousInterviewAtom, store.get(interviewAtom));
    // Reset the current interview state
    store.set(interviewRuntimeAtom, {
      phase: "preparing",
    });
    store.set(interviewAtom, getInterviewDefault());

    router.push("/review");
  }

  return {
    startInterview,
    togglePause,
    endResponse: () => {},
    endInterviewEarly: () => {},
  };
}
