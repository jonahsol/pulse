import { useEffect, useState } from "react";

export function useNow(updateFrequency: number = 100) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, updateFrequency);

    return () => clearInterval(interval);
  }, [updateFrequency]);

  return now;
}
