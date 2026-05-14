import responseBlobRepository from "@/logic/storage/repository";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

export const useResponseBlobQuery = (responseId: string) => {
  const t = useTranslations();

  const query = useQuery({
    queryKey: ["responseBlob", responseId],
    queryFn: async () => {
      const blob = await responseBlobRepository.getBlob(responseId);
      if (!blob) {
        throw new Error("Blob not found");
      }

      return blob;
    },
    // 5 minute gc for unmounted queries. Avoids filling memory if user navigates
    // many blobs.
    gcTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.isError) toast.error(t("failedToFetchVideo"));
  }, [query.isError]);

  return query;
};

export const useSetResponseBlobMutation = () => {
  return useMutation({
    mutationFn: async ({
      responseId,
      blob,
    }: {
      responseId: string;
      blob: Blob;
    }) => {
      await responseBlobRepository.setBlob(responseId, blob);
    },
  });
};

export const useDeleteResponseBlobMutation = () => {
  return useMutation({
    mutationFn: async ({ responseId }: { responseId: string }) => {
      await responseBlobRepository.deleteBlob(responseId);
    },
  });
};
