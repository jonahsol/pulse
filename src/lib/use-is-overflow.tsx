import { useLayoutEffect, useRef, useState } from "react";

export function useIsOverflow() {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  useLayoutEffect(() => {
    if (elementRef.current) {
      setIsOverflow(
        elementRef.current.scrollHeight > elementRef.current.clientHeight,
      );
    }
  }, []);

  return {
    isOverflow,
    elementRef,
  };
}
