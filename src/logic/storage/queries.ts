import responseBlobRepository from "@/logic/storage/repository";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useResponseBlobQuery = (responseId: string) => {
  return useQuery({
    queryKey: ["responseBlob", responseId],
    queryFn: async () => {
      const blob = await responseBlobRepository.getBlob(responseId);
      return blob;
    },
    // 5 minute gc for unmounted queries. Avoids filling memory if user navigates
    // many blobs.
    gcTime: 5 * 60 * 1000,
  });
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
