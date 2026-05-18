import { useUserMediaPlayerContext } from "@/logic/context";
import { useCallback } from "react";

/**
 * Request the user's input device.
 */
export async function initUserInputDevice() {
  return await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
}

/**
 * Initialize the preview element with the stream and start playback.
 */
export function useInitPreview() {
  const { userMediaPlayerRef } = useUserMediaPlayerContext();

  const initPreview = useCallback(
    async (stream: MediaStream) => {
      if (userMediaPlayerRef.current) {
        userMediaPlayerRef.current.srcObject = stream;
        await userMediaPlayerRef.current.play();
      } else {
        alert("Preview video element not found");
      }
    },
    [userMediaPlayerRef],
  );

  return { initPreview };
}
