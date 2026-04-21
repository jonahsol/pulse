export type Phase = "idle" | "countdown" | "recording" | "review";

export type Recording = {
  id: string;
  videoUrl: string;
  createdAt: number;
};

export type SavedTake = Recording & {
  question: string;
  questionIndex: number;
  savedAt: number;
};

export type QuestionRecording = {
  question: string;
  recordings: Recording[];
};

export type TranscriptState = {
  status: "idle" | "loading" | "ready" | "error";
  text?: string;
  error?: string;
};
