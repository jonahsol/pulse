import { useInterviewContext } from "@/logic/context";
import { useCallback, useState } from "react";

/**
 * Request the user's input device and store the stream in the context.
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
  const { userMediaPreviewRef } = useInterviewContext();

  const initPreview = useCallback(
    async (stream: MediaStream) => {
      if (userMediaPreviewRef.current) {
        userMediaPreviewRef.current.srcObject = stream;
        await userMediaPreviewRef.current.play();
      } else {
        alert("Preview video element not found");
      }
    },
    [userMediaPreviewRef],
  );

  return { initPreview };
}

/**
 * Initalize a media recorder for the given stream. Return value `mediaRecorder`
 * will be `null` until `initMediaRecorder` is called.
 */
export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const initMediaRecorder = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener("stop", () => {
      setIsRecording(false);
    });
    mediaRecorder.addEventListener("start", () => {
      setIsRecording(true);
    });
    setMediaRecorder(mediaRecorder);
  };

  return { initMediaRecorder, mediaRecorder, isRecording };
}
