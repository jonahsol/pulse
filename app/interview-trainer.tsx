"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const QUESTIONS = [
  "Tell me about yourself and the kind of work that energizes you.",
  "Describe a challenging project you owned and how you handled trade-offs.",
  "Why are you interested in this role, and what would you want to accomplish first?",
];

const COUNTDOWN_SECONDS = 5;
const RECORDING_SECONDS = 60;

type Phase = "idle" | "countdown" | "recording" | "review";

type RecordingEntry = {
  question: string;
  videoUrl: string;
};

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getSupportedMimeType() {
  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

export default function InterviewTrainer() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(RECORDING_SECONDS);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [error, setError] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);

  const previewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingsRef = useRef<RecordingEntry[]>([]);
  const stopRequestedRef = useRef(false);

  const currentQuestion = QUESTIONS[currentQuestionIndex];

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
      const question = QUESTIONS[currentQuestionIndex];

      setRecordings((previous) => [...previous, { question, videoUrl }]);

      recorderRef.current = null;
      chunksRef.current = [];
      stopPreviewStream();

      const nextQuestionIndex = currentQuestionIndex + 1;

      if (nextQuestionIndex >= QUESTIONS.length) {
        setPhase("review");
        return;
      }

      await prepareQuestion(nextQuestionIndex);
    };

    recorder.onerror = () => {
      setError("Recording failed. Please refresh and try again.");
      recorderRef.current = null;
      stopPreviewStream();
      setPhase("idle");
    };

    recorderRef.current = recorder;
    setRecordingTimeLeft(RECORDING_SECONDS);
    setPhase("recording");
    recorder.start();
  }, [currentQuestionIndex, prepareQuestion, stopPreviewStream]);

  const startInterview = useCallback(async () => {
    for (const recording of recordingsRef.current) {
      URL.revokeObjectURL(recording.videoUrl);
    }

    setRecordings([]);
    await prepareQuestion(0);
  }, [prepareQuestion]);

  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

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
    if (phase !== "countdown") {
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
  }, [countdown, phase, startRecording]);

  useEffect(() => {
    if (phase !== "recording") {
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
  }, [phase, recordingTimeLeft, stopRecording]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }

      stopPreviewStream();

      for (const recording of recordingsRef.current) {
        URL.revokeObjectURL(recording.videoUrl);
      }
    };
  }, [stopPreviewStream]);

  const isLocked = phase === "countdown" || phase === "recording";

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
          {phase !== "review" ? (
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Question {Math.min(currentQuestionIndex + 1, QUESTIONS.length)} of{" "}
              {QUESTIONS.length}
            </div>
          ) : null}
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          {phase === "review" ? (
            <div className="w-full max-w-4xl space-y-6">
              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                    Review
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    Replay every answer
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Each recording stayed in memory only for this session and is
                    paired with its interview prompt.
                  </p>
                </div>
                <button
                  className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  onClick={startInterview}
                  type="button"
                >
                  Restart interview
                </button>
              </div>

              {recordings.map((recording, index) => (
                <article
                  className="space-y-5 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30"
                  key={`${recording.question}-${index}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                      Question {index + 1}
                    </p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {RECORDING_SECONDS}s limit
                    </span>
                  </div>
                  <h3 className="text-xl font-medium leading-8 text-white">
                    {recording.question}
                  </h3>
                  {/* biome-ignore lint/a11y/useMediaCaption: Local interview recordings do not have generated captions in this prototype. */}
                  <video
                    className="w-full rounded-2xl border border-white/10 bg-black"
                    controls
                    playsInline
                    preload="metadata"
                    src={recording.videoUrl}
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-12">
                {isLocked ? (
                  <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-cyan-400/20" />
                ) : null}

                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                  Current prompt
                </p>
                <div className="flex min-h-[320px] items-center justify-center">
                  <h2 className="max-w-3xl text-center text-3xl font-semibold leading-tight text-white md:text-5xl">
                    {currentQuestion}
                  </h2>
                </div>

                <div className="flex items-center justify-center pt-6">
                  {phase === "idle" ? (
                    <button
                      className="rounded-full bg-cyan-400 px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
                      disabled={isPreparing}
                      onClick={startInterview}
                      type="button"
                    >
                      {isPreparing ? "Preparing camera..." : "Start interview"}
                    </button>
                  ) : null}

                  {phase === "countdown" ? (
                    <div className="text-center">
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
                        Recording starts in
                      </p>
                      <div className="mt-3 text-8xl font-semibold text-cyan-300">
                        {countdown}
                      </div>
                    </div>
                  ) : null}

                  {phase === "recording" ? (
                    <div className="text-center">
                      <p className="text-sm uppercase tracking-[0.3em] text-red-300">
                        Recording live
                      </p>
                      <div className="mt-3 text-5xl font-semibold text-white">
                        {formatSeconds(recordingTimeLeft)}
                      </div>
                    </div>
                  ) : null}
                </div>

                {error ? (
                  <p className="pt-6 text-center text-sm text-rose-300">
                    {error}
                  </p>
                ) : null}
              </div>

              <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900/90 p-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                    Camera
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Live preview</h3>
                </div>

                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                  {phase === "countdown" || phase === "recording" ? (
                    <>
                      <video
                        autoPlay
                        className={`aspect-video w-full object-cover ${
                          phase === "countdown" ? "opacity-60 blur-[2px]" : ""
                        }`}
                        muted
                        playsInline
                        ref={previewRef}
                      />
                      {phase === "countdown" ? (
                        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm leading-6 text-slate-100">
                          Camera is ready. Recording will begin automatically
                          after the countdown.
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex aspect-video items-center justify-center px-6 text-center text-sm leading-6 text-slate-400">
                      Start the interview to enable webcam and microphone
                      recording.
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Countdown
                    </p>
                    <p className="mt-3 text-2xl font-semibold">
                      {COUNTDOWN_SECONDS}s
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Answer time
                    </p>
                    <p className="mt-3 text-2xl font-semibold">
                      {RECORDING_SECONDS}s
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                  The interface locks during the timed flow so you can focus on
                  answering under pressure.
                </div>
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
