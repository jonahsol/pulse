"use client";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ClientOnly } from "@/components/utils/client-only";
import { savedTakesAtom } from "@/logic/atoms";
import { atom, useAtomValue } from "jotai";
import { BookmarkIcon, Link } from "lucide-react";
import { useTranslations } from "next-intl";

const hasSavedTakesAtom = atom((get) => get(savedTakesAtom).length > 0);

export function SavedTakesSection() {
  const hasSavedTakes = useAtomValue(hasSavedTakesAtom);
  const t = useTranslations("AppShell");

  if (!hasSavedTakes) return null;
  return (
    <ClientOnly>
      <Link
        href="/saved"
        className={buttonVariants({ variant: "ghost", size: "lg" })}
        data-icon="inline-start"
      >
        <BookmarkIcon />
        {t("savedTakes")}
      </Link>

      <Separator orientation="vertical" className="ml-5 mr-8 hidden sm:block" />
    </ClientOnly>
  );
}
