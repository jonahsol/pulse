import { useInterviewController } from "@/logic/interview-controller";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useRef } from "react";

type PlayerContextType = {
  userMediaPlayerRef: React.RefObject<HTMLVideoElement | null>;
  setUserMediaPlayerRef: (el: HTMLVideoElement) => void;
  waitForUserMediaPlayer: () => Promise<void>;
};
const UserMediaPlayerContext = createContext<PlayerContextType | undefined>(
  undefined,
);

export function UserMediaContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const userMediaPlayerRef = useRef<HTMLVideoElement | null>(null);
  const waitersRef = useRef<Array<(el: HTMLVideoElement) => void>>([]);

  const setUserMediaPlayerRef = useCallback((el: HTMLVideoElement | null) => {
    userMediaPlayerRef.current = el;

    if (el) {
      waitersRef.current.splice(0).forEach((resolve) => {
        resolve(el);
      });
    }
  }, []);

  function waitForUserMediaPlayer(): Promise<void> {
    if (userMediaPlayerRef.current) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      waitersRef.current.push(() => resolve());
    });
  }

  return (
    <UserMediaPlayerContext.Provider
      value={{
        userMediaPlayerRef,
        waitForUserMediaPlayer,
        setUserMediaPlayerRef,
      }}
    >
      {children}
    </UserMediaPlayerContext.Provider>
  );
}
export const useUserMediaPlayerContext = () => {
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
