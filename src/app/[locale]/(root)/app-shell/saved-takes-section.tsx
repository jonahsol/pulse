"use client";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ClientOnly } from "@/components/utils/client-only";
import { previousInterviewAtom } from "@/logic/atoms";
import { useAtomValue } from "jotai";
import { BookmarkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function SavedTakesSection() {
  const hasPreviousInterview = useAtomValue(previousInterviewAtom);
  const t = useTranslations("AppShell");
  console.log("hasPreviousInterview", hasPreviousInterview);

  if (!hasPreviousInterview) return null;
  return (
    <ClientOnly>
      <div className="flex items-center">
        <Link
          href="/saved"
          className={buttonVariants({ variant: "ghost", size: "lg" })}
          data-icon="inline-start"
        >
          <BookmarkIcon />
          {t("savedTakes")}
        </Link>

        <Separator orientation="vertical" className="ml-5 mr-8" />
      </div>
    </ClientOnly>
  );
}
