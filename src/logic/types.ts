// An interview question.
export type Question = { id: string; prompt: string; index: number };

// Ephemeral runtime state of the interview.
export type InterviewRuntime =
  | {
      phase: "preparing";
    }
  | {
      phase: "question" | "countdown";
      phaseStartedAt: number;
    };

// Persistent state of the interview.
export type Interview = {
  // When phase is countdown, countdownDuration is the duration of the countdown.
  countdownDuration: number;
  // When phase is question, questionDuration is the duration of the question.
  questionDuration: number;
  // The index of the current question
  currentQuestionIndex: number;
  // The questions to be asked
  questions: Question[];
  isRetaking: boolean;
  // { questionId: Response[] }
  responses: Record<string, Response[]>;
};

// A response to a question.
export type Response = {
  id: string;
  transcript?: string;
  createdAt: Date;
};

export type SavedTake = {
  id: string;
  question: Question;
  response: Response;
};

// Configuration for retaking a response.
type RetakeInterviewConfig =
  | {
      isRetaking: true;
      retakeQuestionIndex: number;
    }
  | {
      isRetaking: false;
      retakeQuestionIndex?: undefined;
    };

// Configuration for an interview.
export type InterviewConfig = {
  questions: Question[];
  countdownDuration: number;
  questionDuration: number;
  responses: Record<string, Response[]>;
} & RetakeInterviewConfig;
