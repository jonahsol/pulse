"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { Recording, SavedTake, TranscriptState } from "./types";

type SavedTakesPanelProps = {
  onGenerateTranscript: (recording: Recording) => void;
  onRemoveBookmark: (savedTakeId: string) => void;
  savedTakes: SavedTake[];
  transcripts: Record<string, TranscriptState>;
};

function BookmarkIcon({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V21l-5-3.2L7 21V4.75Z" />
    </svg>
  );
}

export function SavedTakesPanel({
  onGenerateTranscript,
  onRemoveBookmark,
  savedTakes,
  transcripts,
}: SavedTakesPanelProps) {
  if (savedTakes.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-none backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-lg">Saved takes</CardTitle>
          <CardDescription>
            Stored in this browser so you can revisit them later.
          </CardDescription>
        </div>
        <Badge variant="secondary">
          {savedTakes.length} saved {savedTakes.length === 1 ? "take" : "takes"}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4">
        {savedTakes.map((savedTake) => (
          <Card className="bg-card/90 shadow-none" key={savedTake.id} size="sm">
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <Badge variant="outline">
                  Question {savedTake.questionIndex + 1}
                </Badge>
                <CardTitle className="text-base font-medium leading-snug">
                  {savedTake.question}
                </CardTitle>
              </div>
              <Button
                aria-label="Remove bookmark"
                onClick={() => onRemoveBookmark(savedTake.id)}
                size="sm"
                type="button"
                variant="outline"
              >
                <BookmarkIcon className="size-4" filled />
                Saved
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-xs">
                Recorded {new Date(savedTake.createdAt).toLocaleString()}
              </p>
              {/* biome-ignore lint/a11y/useMediaCaption: Saved interview recordings do not have generated captions in this prototype. */}
              <video
                className="w-full rounded-lg border border-border bg-black"
                controls
                playsInline
                preload="metadata"
                src={savedTake.videoUrl}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  disabled={transcripts[savedTake.id]?.status === "loading"}
                  onClick={() => onGenerateTranscript(savedTake)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {transcripts[savedTake.id]?.status === "loading"
                    ? "Generating transcript…"
                    : transcripts[savedTake.id]?.status === "ready"
                      ? "Regenerate transcript"
                      : "Transcript"}
                </Button>
                <span className="text-muted-foreground text-xs">
                  Saved {new Date(savedTake.savedAt).toLocaleString()}
                </span>
              </div>
              {transcripts[savedTake.id]?.status === "ready" ? (
                <div className="bg-muted/40 space-y-2 rounded-lg border border-border/80 p-3">
                  <p className="text-primary text-xs tracking-wide uppercase">
                    Transcript
                  </p>
                  <p className="text-sm leading-relaxed">
                    {transcripts[savedTake.id]?.text}
                  </p>
                </div>
              ) : null}
              {transcripts[savedTake.id]?.status === "error" ? (
                <Alert variant="destructive">
                  <AlertTitle>Transcript</AlertTitle>
                  <AlertDescription>
                    {transcripts[savedTake.id]?.error}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
