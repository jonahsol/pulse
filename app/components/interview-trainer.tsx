"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { InterviewPhase } from "./interview-trainer/interview-phase";
import { ReviewPhase } from "./interview-trainer/review-phase";
import type {
  Phase,
  QuestionRecording,
  Recording,
  SavedTake,
  TranscriptState,
} from "./interview-trainer/types";

const COUNTDOWN_SECONDS = 5;
const RECORDING_SECONDS = 60;
const BOOKMARKED_TAKES_STORAGE_KEY = "interview-trainer:bookmarked-takes";

function getSupportedMimeType() {
  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

function createQuestionRecordings(questions: string[]) {
  return questions.map((question) => ({
    question,
    recordings: [],
  }));
}

function isSavedTake(value: unknown): value is SavedTake {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SavedTake>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.videoUrl === "string" &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.question === "string" &&
    typeof candidate.questionIndex === "number" &&
    typeof candidate.savedAt === "number"
  );
}

function sortSavedTakes(savedTakes: SavedTake[]) {
  return [...savedTakes].sort((left, right) => right.savedAt - left.savedAt);
}

function readSavedTakesFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawSavedTakes = window.localStorage.getItem(
      BOOKMARKED_TAKES_STORAGE_KEY,
    );

    if (!rawSavedTakes) {
      return [];
    }

    const parsedSavedTakes = JSON.parse(rawSavedTakes) as unknown;

    if (!Array.isArray(parsedSavedTakes)) {
      return [];
    }

    return sortSavedTakes(parsedSavedTakes.filter(isSavedTake));
  } catch {
    return [];
  }
}

function writeSavedTakesToStorage(savedTakes: SavedTake[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    BOOKMARKED_TAKES_STORAGE_KEY,
    JSON.stringify(savedTakes),
  );
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read the saved take."));
    };
    reader.onerror = () => {
      reject(new Error("Unable to read the saved take."));
    };

    reader.readAsDataURL(blob);
  });
}

export default function InterviewTrainer() {
  const t = useTranslations("InterviewTrainer");
  const questions = t.raw("questions") as string[];
  const [phase, setPhase] = useState<Phase>("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [endedEarly, setEndedEarly] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(RECORDING_SECONDS);
  const [recordings, setRecordings] = useState<QuestionRecording[]>(() =>
    createQuestionRecordings(questions),
  );
  const [error, setError] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [retakeQuestionIndex, setRetakeQuestionIndex] = useState<number | null>(
    null,
  );
  const [latestRecordingId, setLatestRecordingId] = useState<string | null>(
    null,
  );
  const [transcripts, setTranscripts] = useState<
    Record<string, TranscriptState>
  >({});
  const [savedTakes, setSavedTakes] = useState<SavedTake[]>([]);
  const [bookmarkError, setBookmarkError] = useState("");
  const [isSavingRecordingId, setIsSavingRecordingId] = useState<string | null>(
    null,
  );

  const previewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingsRef = useRef<QuestionRecording[]>(
    createQuestionRecordings(questions),
  );
  const endEarlyRequestedRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isRetaking = retakeQuestionIndex !== null;

  const revokeRecordingUrls = useCallback(
    (recordingGroups: QuestionRecording[]) => {
      for (const recordingGroup of recordingGroups) {
        for (const recording of recordingGroup.recordings) {
          URL.revokeObjectURL(recording.videoUrl);
        }
      }
    },
    [],
  );

  const stopPreviewStream = useCallback(() => {
    const stream = streamRef.current;

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    streamRef.current = null;

    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }
  }, []);

  const prepareQuestion = useCallback(
    async (questionIndex: number) => {
      if (
        typeof window === "undefined" ||
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        setError(t("errors.browserNotSupported"));
        setPhase("idle");
        return;
      }

      setIsPreparing(true);
      setError("");
      setIsPaused(false);
      endEarlyRequestedRef.current = false;
      stopRequestedRef.current = false;
      stopPreviewStream();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = stream;
        setCurrentQuestionIndex(questionIndex);
        setCountdown(COUNTDOWN_SECONDS);
        setRecordingTimeLeft(RECORDING_SECONDS);
        setPhase("countdown");

        if (previewRef.current) {
          previewRef.current.srcObject = stream;
          await previewRef.current.play().catch(() => undefined);
        }
      } catch {
        setError(t("errors.cameraAccessRequired"));
        setPhase("idle");
        stopPreviewStream();
      } finally {
        setIsPreparing(false);
      }
    },
    [stopPreviewStream, t],
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;

    if (
      !recorder ||
      recorder.state === "inactive" ||
      stopRequestedRef.current
    ) {
      return;
    }

    stopRequestedRef.current = true;
    recorder.stop();
  }, []);

  const togglePause = useCallback(() => {
    if (phase !== "countdown" && phase !== "recording") {
      return;
    }

    if (isPaused) {
      if (phase === "recording" && recorderRef.current?.state === "paused") {
        try {
          recorderRef.current.resume();
        } catch {
          setError(t("errors.resumeRecording"));
          return;
        }
      }

      setError("");
      setIsPaused(false);
      return;
    }

    if (phase === "recording" && recorderRef.current?.state === "recording") {
      try {
        recorderRef.current.pause();
      } catch {
        setError(t("errors.pauseRecording"));
        return;
      }
    }

    setError("");
    setIsPaused(true);
  }, [isPaused, phase, t]);

  const endInterviewEarly = useCallback(() => {
    if (phase !== "countdown" && phase !== "recording") {
      return;
    }

    setError("");
    setIsPaused(false);
    setEndedEarly(true);
    endEarlyRequestedRef.current = true;

    if (phase === "recording") {
      stopRecording();
      return;
    }

    stopPreviewStream();
    setPhase("review");
  }, [phase, stopPreviewStream, stopRecording]);

  const startRetake = useCallback(
    async (questionIndex: number) => {
      setRetakeQuestionIndex(questionIndex);
      await prepareQuestion(questionIndex);
    },
    [prepareQuestion],
  );

  const persistSavedTakes = useCallback((nextSavedTakes: SavedTake[]) => {
    const sortedSavedTakes = sortSavedTakes(nextSavedTakes);

    setSavedTakes(sortedSavedTakes);
    writeSavedTakesToStorage(sortedSavedTakes);
  }, []);

  const removeBookmark = useCallback((savedTakeId: string) => {
    setBookmarkError("");

    setSavedTakes((previous) => {
      const nextSavedTakes = previous.filter(
        (savedTake) => savedTake.id !== savedTakeId,
      );

      writeSavedTakesToStorage(nextSavedTakes);

      return nextSavedTakes;
    });
  }, []);

  const toggleBookmark = useCallback(
    async ({
      question,
      questionIndex,
      recording,
    }: {
      question: string;
      questionIndex: number;
      recording: Recording;
    }) => {
      setBookmarkError("");

      if (savedTakes.some((savedTake) => savedTake.id === recording.id)) {
        removeBookmark(recording.id);
        return;
      }

      setIsSavingRecordingId(recording.id);

      try {
        const videoResponse = await fetch(recording.videoUrl);

        if (!videoResponse.ok) {
          throw new Error(t("errors.readTakeForBookmark"));
        }

        const videoBlob = await videoResponse.blob();
        const savedVideoUrl = await blobToDataUrl(videoBlob);
        const savedTake: SavedTake = {
          ...recording,
          question,
          questionIndex,
          savedAt: Date.now(),
          videoUrl: savedVideoUrl,
        };

        persistSavedTakes([...savedTakes, savedTake]);
      } catch (error) {
        setBookmarkError(
          error instanceof Error ? error.message : t("errors.bookmarkTake"),
        );
      } finally {
        setIsSavingRecordingId(null);
      }
    },
    [persistSavedTakes, removeBookmark, savedTakes, t],
  );

  const generateTranscript = useCallback(
    async (recording: Recording) => {
      setTranscripts((previous) => ({
        ...previous,
        [recording.id]: {
          status: "loading",
        },
      }));

      try {
        const videoResponse = await fetch(recording.videoUrl);

        if (!videoResponse.ok) {
          throw new Error(t("errors.readRecordingForTranscription"));
        }

        const videoBlob = await videoResponse.blob();
        const fileExtension = videoBlob.type.includes("mp4") ? "mp4" : "webm";
        const formData = new FormData();

        formData.append("file", videoBlob, `${recording.id}.${fileExtension}`);

        const response = await fetch("/api/transcript", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as
          | {
              transcript?: string;
              error?: string;
            }
          | undefined;

        if (!response.ok || !data?.transcript) {
          throw new Error(data?.error ?? t("errors.transcriptionFailed"));
        }

        setTranscripts((previous) => ({
          ...previous,
          [recording.id]: {
            status: "ready",
            text: data.transcript,
          },
        }));
      } catch (error) {
        setTranscripts((previous) => ({
          ...previous,
          [recording.id]: {
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : t("errors.generateTranscript"),
          },
        }));
      }
    },
    [t],
  );

  const startRecording = useCallback(() => {
    const stream = streamRef.current;

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      return;
    }

    if (!stream) {
      setError(t("errors.cameraStreamUnavailable"));
      setPhase("idle");
      return;
    }

    chunksRef.current = [];
    stopRequestedRef.current = false;

    const mimeType = getSupportedMimeType();
    const questionIndex = currentQuestionIndex;
    const isRetakeAttempt = retakeQuestionIndex !== null;
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blobType = mimeType ?? "video/webm";
      const videoBlob = new Blob(chunksRef.current, { type: blobType });
      const videoUrl = URL.createObjectURL(videoBlob);
      const recordingId = crypto.randomUUID();
      const endEarlyRequested = endEarlyRequestedRef.current;

      setIsPaused(false);
      setRecordings((previous) =>
        previous.map((recordingGroup, index) =>
          index === questionIndex
            ? {
                ...recordingGroup,
                recordings: [
                  ...recordingGroup.recordings,
                  {
                    id: recordingId,
                    videoUrl,
                    createdAt: Date.now(),
                  },
                ],
              }
            : recordingGroup,
        ),
      );
      setLatestRecordingId(recordingId);

      recorderRef.current = null;
      chunksRef.current = [];
      stopPreviewStream();

      if (endEarlyRequested) {
        endEarlyRequestedRef.current = false;
        setPhase("review");
        return;
      }

      if (isRetakeAttempt) {
        setRetakeQuestionIndex(null);
        setPhase("review");
        return;
      }

      const nextQuestionIndex = questionIndex + 1;

      if (nextQuestionIndex >= questions.length) {
        setPhase("review");
        return;
      }

      await prepareQuestion(nextQuestionIndex);
    };

    recorder.onerror = () => {
      setError(t("errors.recordingFailed"));
      setIsPaused(false);
      recorderRef.current = null;
      stopPreviewStream();
      setPhase("idle");
    };

    recorderRef.current = recorder;
    setIsPaused(false);
    setRecordingTimeLeft(RECORDING_SECONDS);
    setPhase("recording");
    recorder.start();
  }, [
    currentQuestionIndex,
    prepareQuestion,
    questions.length,
    retakeQuestionIndex,
    stopPreviewStream,
    t,
  ]);

  const startInterview = useCallback(async () => {
    revokeRecordingUrls(recordingsRef.current);
    endEarlyRequestedRef.current = false;
    setEndedEarly(false);
    setIsPaused(false);
    setBookmarkError("");
    setRetakeQuestionIndex(null);
    setLatestRecordingId(null);
    setTranscripts({});
    setRecordings(createQuestionRecordings(questions));
    await prepareQuestion(0);
  }, [prepareQuestion, questions, revokeRecordingUrls]);

  const viewSavedTakes = useCallback(() => {
    setBookmarkError("");
    setError("");
    setEndedEarly(false);
    setIsPaused(false);
    setRetakeQuestionIndex(null);
    setLatestRecordingId(null);
    setPhase("review");
  }, []);

  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  useEffect(() => {
    setSavedTakes(readSavedTakesFromStorage());
  }, []);

  useEffect(() => {
    if (
      (phase !== "countdown" && phase !== "recording") ||
      !previewRef.current ||
      !streamRef.current
    ) {
      return;
    }

    if (previewRef.current.srcObject !== streamRef.current) {
      previewRef.current.srcObject = streamRef.current;
      previewRef.current.play().catch(() => undefined);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown" || isPaused) {
      return;
    }

    if (countdown === 0) {
      startRecording();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [countdown, isPaused, phase, startRecording]);

  useEffect(() => {
    if (phase !== "recording" || isPaused) {
      return;
    }

    if (recordingTimeLeft === 0) {
      stopRecording();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRecordingTimeLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [isPaused, phase, recordingTimeLeft, stopRecording]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }

      stopPreviewStream();

      revokeRecordingUrls(recordingsRef.current);
    };
  }, [revokeRecordingUrls, stopPreviewStream]);

  const isLocked = phase === "countdown" || phase === "recording";
  const hasInterviewStarted = phase !== "idle" || isRetaking;
  const canTogglePause = phase === "countdown" || phase === "recording";
  const canEndEarly = canTogglePause && !isRetaking;

  const recordingElapsedSeconds = RECORDING_SECONDS - recordingTimeLeft;

  return (
    <div className="flex flex-1 flex-col justify-center">
      {phase === "review" ? (
        <ReviewPhase
          bookmarkError={bookmarkError}
          endedEarly={endedEarly}
          isLocked={isLocked}
          isPreparing={isPreparing}
          isSavingRecordingId={isSavingRecordingId}
          latestRecordingId={latestRecordingId}
          onGenerateTranscript={generateTranscript}
          onRemoveBookmark={removeBookmark}
          onRestartInterview={startInterview}
          onStartRetake={startRetake}
          onToggleBookmark={toggleBookmark}
          recordings={recordings}
          recordingSeconds={RECORDING_SECONDS}
          transcripts={transcripts}
          savedTakes={savedTakes}
        />
      ) : (
        <InterviewPhase
          canEndEarly={canEndEarly}
          canTogglePause={canTogglePause}
          countdown={countdown}
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          error={error}
          hasInterviewStarted={hasInterviewStarted}
          isLocked={isLocked}
          isPaused={isPaused}
          isPreparing={isPreparing}
          isRetaking={isRetaking}
          onDoneRecording={stopRecording}
          onEndEarly={endInterviewEarly}
          onPrimaryAction={() =>
            isRetaking ? startRetake(currentQuestionIndex) : startInterview()
          }
          onTogglePause={togglePause}
          phase={phase}
          previewRef={previewRef}
          questionCount={questions.length}
          recordingElapsedSeconds={recordingElapsedSeconds}
          recordingSeconds={RECORDING_SECONDS}
          startCountdownSeconds={COUNTDOWN_SECONDS}
        />
      )}
    </div>
  );
}
