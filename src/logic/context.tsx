import { useInterviewController } from "@/logic/interview-controller";
import type { ReactNode } from "react";
import { createContext, useContext, useRef } from "react";

type PlayerContextType = {
  userMediaPlayerRef: React.RefObject<HTMLVideoElement | null>;
};
const UserMediaPlayerContext = createContext<PlayerContextType | undefined>(
  undefined,
);

export function UserMediaContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const userMediaPlayerRef = useRef<HTMLVideoElement>(null);

  return (
    <UserMediaPlayerContext.Provider
      value={{
        userMediaPlayerRef,
      }}
    >
      {children}
    </UserMediaPlayerContext.Provider>
  );
}
export const userMediaPlayerContext = () => {
  const context = useContext(UserMediaPlayerContext);

  if (!context) {
    throw new Error(
      "userMediaPlayerContext must be used within a UserMediaPlayerContext",
    );
  }
  return context;
};

export const InterviewControllerContext = createContext<
  ReturnType<typeof useInterviewController> | undefined
>(undefined);
export function InterviewControllerContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const interviewController = useInterviewController();

  return (
    <InterviewControllerContext.Provider value={interviewController}>
      {children}
    </InterviewControllerContext.Provider>
  );
}
export const useInterviewControllerContext = () => {
  const context = useContext(InterviewControllerContext);
  if (!context) {
    throw new Error(
      "useInterviewControllerContext must be used within a InterviewControllerContext",
    );
  }
  return context;
};
