"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { InterviewHeader } from "./components/interview-trainer/interview-header";
import { InterviewPhase } from "./components/interview-trainer/interview-phase";
import { ReviewPhase } from "./components/interview-trainer/review-phase";
import type {
  Phase,
  QuestionRecording,
  Recording,
  SavedTake,
  TranscriptState,
} from "./components/interview-trainer/types";

const QUESTIONS = [
  "Tell me about yourself and the kind of work that energizes you.",
  "Describe a challenging project you owned and how you handled trade-offs.",
  "Describe a time you had to deliver a project on a very tight deadline.",
  "Why are you interested in this role, and what would you want to accomplish first?",
];

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

function createQuestionRecordings() {
  return QUESTIONS.map((question) => ({
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
  const [phase, setPhase] = useState<Phase>("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [endedEarly, setEndedEarly] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(RECORDING_SECONDS);
  const [recordings, setRecordings] = useState<QuestionRecording[]>(
    createQuestionRecordings,
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
  const recordingsRef = useRef<QuestionRecording[]>(createQuestionRecordings());
  const endEarlyRequestedRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
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
        setError("This browser does not support camera recording.");
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
        setError("Camera and microphone access are required to start.");
        setPhase("idle");
        stopPreviewStream();
      } finally {
        setIsPreparing(false);
      }
    },
    [stopPreviewStream],
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
          setError("Unable to resume recording right now.");
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
        setError("Unable to pause recording right now.");
        return;
      }
    }

    setError("");
    setIsPaused(true);
  }, [isPaused, phase]);

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
          throw new Error("Unable to read this take for bookmarking.");
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
          error instanceof Error
            ? error.message
            : "Unable to bookmark this take right now.",
        );
      } finally {
        setIsSavingRecordingId(null);
      }
    },
    [persistSavedTakes, removeBookmark, savedTakes],
  );

  const generateTranscript = useCallback(async (recording: Recording) => {
    setTranscripts((previous) => ({
      ...previous,
      [recording.id]: {
        status: "loading",
      },
    }));

    try {
      const videoResponse = await fetch(recording.videoUrl);

      if (!videoResponse.ok) {
        throw new Error("Unable to read the recording for transcription.");
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
        throw new Error(data?.error ?? "Transcription failed.");
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
              : "Unable to generate a transcript right now.",
        },
      }));
    }
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      return;
    }

    if (!stream) {
      setError("Unable to access the camera stream for this question.");
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

      if (nextQuestionIndex >= QUESTIONS.length) {
        setPhase("review");
        return;
      }

      await prepareQuestion(nextQuestionIndex);
    };

    recorder.onerror = () => {
      setError("Recording failed. Please refresh and try again.");
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
    retakeQuestionIndex,
    stopPreviewStream,
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
    setRecordings(createQuestionRecordings());
    await prepareQuestion(0);
  }, [prepareQuestion, revokeRecordingUrls]);

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Interview Trainer
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Timed mock interview with real recording
            </h1>
          </div>
          {phase !== "review" && hasInterviewStarted ? (
            <InterviewHeader
              canEndEarly={canEndEarly}
              canTogglePause={canTogglePause}
              currentQuestionIndex={currentQuestionIndex}
              isPaused={isPaused}
              isRetaking={isRetaking}
              onEndEarly={endInterviewEarly}
              onTogglePause={togglePause}
              questionCount={QUESTIONS.length}
            />
          ) : null}
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
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
              savedTakes={savedTakes}
              transcripts={transcripts}
            />
          ) : (
            <InterviewPhase
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
              onPrimaryAction={() =>
                isRetaking
                  ? startRetake(currentQuestionIndex)
                  : startInterview()
              }
              onViewSavedTakes={viewSavedTakes}
              phase={phase}
              previewRef={previewRef}
              recordingSeconds={RECORDING_SECONDS}
              recordingTimeLeft={recordingTimeLeft}
              savedTakeCount={savedTakes.length}
              startCountdownSeconds={COUNTDOWN_SECONDS}
            />
          )}
        </section>
      </div>
    </main>
  );
}
