// "use client";

import { PulseLogo } from "@/app/components/interview-trainer/pulse-logo";
import { LocaleSwitch } from "@/app/components/locale-switch";
import { ThemeToggle } from "@/app/components/theme-switch";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

type PulseShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: PulseShellProps) {
  const t = await getTranslations("AppShell");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 md:px-8">
        <PulseLogo />
        <div className="flex items-center gap-2">
          <Button
            //   disabled={disableNewSession || isPreparing}
            //   onClick={onNewSession}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("newSession")}
          </Button>
          <ThemeToggle />
          <LocaleSwitch />
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center px-5 pb-12 md:px-8">
        <div className="flex w-full max-w-[700px] flex-1 flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
