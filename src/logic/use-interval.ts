import { useRef, useEffect } from "react";

/**
 * `useInterval` hook runs callback every `delay` milliseconds, without resetting
 * the interval if the `callback` changes.
 */
export function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      let id = setInterval(
        () => savedCallback.current && savedCallback.current(),
        delay,
      );
      return () => clearInterval(id);
    }
  }, [delay]);
}
