/** JSON body from `POST /api/transcript` (success or error payload). */
export type TranscriptApiJson = {
  transcript?: string;
  error?: string;
};
