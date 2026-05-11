export type Question = { id: string; prompt: string; index: number };

export type InterviewState = {
  // When phase is "preparing", the interview has not started yet. When phase is
  // "complete", the interview has finished.
  phase: "preparing" | "countdown" | "question" | "complete";
  // When phase is countdown, countdownTime starts at 0 and counts up to countdownDuration
  countdownTime: number;
  countdownDuration: number;
  // When phase is question, questionTime starts at 0 and counts up to questionDuration
  questionTime: number;
  questionDuration: number;
  // The index of the current question
  currentQuestionIndex: number;
  // The questions to be asked
  questions: Question[];
  endedEarly: boolean;
  isRetaking: boolean;
  // { questionId: Response[] }
  responses: Record<string, Response[]>;
};

export type Response = {
  id: string;
  transcript?: string;
  createdAt: Date;
};
