"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("SavedTakesPanel");

  if (savedTakes.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-none backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-lg">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </div>
        <Badge variant="secondary">
          {t("savedCount", { count: savedTakes.length })}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4">
        {savedTakes.map((savedTake) => (
          <Card className="bg-card/90 shadow-none" key={savedTake.id} size="sm">
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <Badge variant="outline">
                  {t("questionBadge", {
                    question: savedTake.questionIndex + 1,
                  })}
                </Badge>
                <CardTitle className="text-base font-medium leading-snug">
                  {savedTake.question}
                </CardTitle>
              </div>
              <Button
                aria-label={t("actions.removeBookmarkAria")}
                onClick={() => onRemoveBookmark(savedTake.id)}
                size="sm"
                type="button"
                variant="outline"
              >
                <BookmarkIcon className="size-4" filled />
                {t("saved")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-xs">
                {t("recordedAt", {
                  date: new Date(savedTake.createdAt).toLocaleString(),
                })}
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
                    ? t("transcript.generating")
                    : transcripts[savedTake.id]?.status === "ready"
                      ? t("transcript.regenerate")
                      : t("transcript.default")}
                </Button>
                <span className="text-muted-foreground text-xs">
                  {t("savedAt", {
                    date: new Date(savedTake.savedAt).toLocaleString(),
                  })}
                </span>
              </div>
              {transcripts[savedTake.id]?.status === "ready" ? (
                <div className="bg-muted/40 space-y-2 rounded-lg border border-border/80 p-3">
                  <p className="text-primary text-xs tracking-wide uppercase">
                    {t("transcript.label")}
                  </p>
                  <p className="text-sm leading-relaxed">
                    {transcripts[savedTake.id]?.text}
                  </p>
                </div>
              ) : null}
              {transcripts[savedTake.id]?.status === "error" ? (
                <Alert variant="destructive">
                  <AlertTitle>{t("transcript.label")}</AlertTitle>
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
