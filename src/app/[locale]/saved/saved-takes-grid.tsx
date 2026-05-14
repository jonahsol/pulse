"use client";

import { SavedTakeCard } from "@/app/[locale]/saved/saved-take-card";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsClient } from "@/lib/client-utils";
import { savedTakesAtom } from "@/logic/atoms";
import { SavedTake } from "@/logic/types";
import { IconBookmark } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import Link from "next/link";

type OuterProps = {
  children: React.ReactNode;
};
function Outer({ children }: OuterProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  );
}

export function SavedTakesGrid() {
  const [savedTakes, setSavedTakes] = useAtom(savedTakesAtom);
  const isClient = useIsClient();

  if (!isClient) return <SavedTakesGridSkeleton />;
  else if (savedTakes.length === 0) return <EmptyState />;
  return (
    <Outer>
      {savedTakes.map((savedTake) => {
        const handleSavedTake = (savedTake: SavedTake) => {
          setSavedTakes(
            savedTakes.map((s) => (savedTake.id === s.id ? savedTake : s)),
          );
        };
        const handleDelete = () => {
          setSavedTakes(savedTakes.filter((s) => s.id !== savedTake.id));
        };

        return (
          <SavedTakeCard
            key={savedTake.id}
            savedTake={savedTake}
            onSavedTake={handleSavedTake}
            onDelete={handleDelete}
          />
        );
      })}
    </Outer>
  );
}

function SavedTakesGridSkeleton() {
  return (
    <Outer>
      {Array.from({ length: 12 }).map((_, index) => (
        <Skeleton className="h-[470px]" key={index} />
      ))}
    </Outer>
  );
}
SavedTakesGrid.Skeleton = SavedTakesGridSkeleton;

function EmptyState() {
  const t = useTranslations("SavedTakesPage");

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBookmark />
        </EmptyMedia>
        <EmptyTitle>{t("emptyState.title")}</EmptyTitle>
        <EmptyDescription>
          <p>{t("emptyState.description1")}</p>
          <p>{t("emptyState.description2")}</p>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          href="/practice"
          className={buttonVariants({ variant: "default" })}
        >
          {t("emptyState.action")}
        </Link>
      </EmptyContent>
    </Empty>
  );
}
