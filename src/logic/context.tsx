import { useInterviewRuntime } from "@/logic/interview";
import type { ReactNode } from "react";
import { createContext, useContext, useRef } from "react";

type InterviewContextType = {
  userMediaPreviewRef: React.RefObject<HTMLVideoElement | null>;
};
const InterviewContext = createContext<InterviewContextType | undefined>(
  undefined,
);

export function InterviewContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const userMediaPreviewRef = useRef<HTMLVideoElement>(null);

  return (
    <InterviewContext.Provider
      value={{
        userMediaPreviewRef,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}
export const useInterviewContext = () => {
  const context = useContext(InterviewContext);

  if (!context) {
    throw new Error(
      "useInterviewContext must be used within a InterviewContext",
    );
  }
  return context;
};

export const InterviewRuntimeContext = createContext<
  ReturnType<typeof useInterviewRuntime> | undefined
>(undefined);
export function InterviewRuntimeContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const interviewRuntime = useInterviewRuntime();
  return (
    <InterviewRuntimeContext.Provider value={interviewRuntime}>
      {children}
    </InterviewRuntimeContext.Provider>
  );
}
export const useInterviewRuntimeContext = () => {
  const context = useContext(InterviewRuntimeContext);
  if (!context) {
    throw new Error(
      "useInterviewRuntimeContext must be used within a InterviewRuntimeContext",
    );
  }
  return context;
};
