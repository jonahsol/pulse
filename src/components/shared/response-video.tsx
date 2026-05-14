"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useResponseBlobQuery } from "@/logic/storage/queries";
import type { Response } from "@/logic/types";
import { useEffect, useState } from "react";

type ResponseVideoProps = {
  response: Response;
  className?: string;
};
export function ResponseVideo({ response, className }: ResponseVideoProps) {
  const responseBlobQuery = useResponseBlobQuery(response.id);

  const [responseBlobUrl, setResponseBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!responseBlobQuery.data) {
      setResponseBlobUrl(null);
      return;
    }

    const url = URL.createObjectURL(responseBlobQuery.data);
    setResponseBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      setResponseBlobUrl(null);
    };
  }, [responseBlobQuery.data]);

  const [aspectRatio, setAspectRatio] = useState<string>("16 / 9");
  const handleLoadedMetadata = (
    event: React.SyntheticEvent<HTMLVideoElement>,
  ) => {
    const video = event.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
    }
  };

  return (
    <div
      className={cn("w-full overflow-hidden bg-black", className)}
      style={{ aspectRatio }}
    >
      {responseBlobQuery.isPending || !responseBlobUrl ? (
        <Skeleton className="size-full" />
      ) : (
        // biome-ignore lint/a11y/useMediaCaption: Local interview recordings do not have generated captions in this prototype.
        <video
          className="size-full object-contain"
          controls
          playsInline
          src={responseBlobUrl}
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}
    </div>
  );
}
