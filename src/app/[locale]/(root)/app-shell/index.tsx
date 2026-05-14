import { SavedTakesSection } from "@/app/[locale]/(root)/app-shell/saved-takes-section";
import { LocaleSwitch } from "@/app/[locale]/(root)/locale-switch";
import { PulseLogo } from "@/app/[locale]/(root)/pulse-logo";
import { ThemeToggle } from "@/app/[locale]/(root)/theme-switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";

const HEADER_HEIGHT = "h-72px";
const MAIN_MIN_HEIGHT = "min-h-[calc(100vh-72px)]";

type PulseShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: PulseShellProps) {
  return (
    <div className="overflow-y-auto">
      <Header />

      <div
        className={`flex flex-1 flex-col items-center px-5 py-12 md:px-8 ${MAIN_MIN_HEIGHT}`}
      >
        <main className={`flex w-full max-w-[700px] flex-1 flex-col`}>
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}

async function Header() {
  return (
    <header
      className={`flex shrink-0 items-center gap-8 px-5 py-4 md:px-8 ${HEADER_HEIGHT}`}
    >
      <Link href="/">
        <PulseLogo />
      </Link>

      <div className="flex ml-auto">
        <SavedTakesSection />
        <SystemControls className="hidden sm:flex" />
      </div>
    </header>
  );
}

function SystemControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ThemeToggle />
      <LocaleSwitch />
    </div>
  );
}

async function Footer() {
  return (
    <footer className="p-4 border-t border-t-border flex justify-between sm:justify-center">
      <BackLinks />
      <SystemControls className="sm:hidden" />
    </footer>
  );
}

async function BackLinks() {
  const t = await getTranslations("AppShell");

  return (
    <div className="flex flex-col items-start sm:items-center">
      <div className="text-sm text-muted-foreground">
        {t("madeWith")}{" "}
        <Button variant="link" asChild className="p-0">
          <a
            href="https://jonahsol.dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jonah Sol
          </a>
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {t("viewRepo")}{" "}
        <Button variant="link" asChild className="p-0" data-icon="inline-start">
          <a
            href="https://github.com/jonahsol/pulse-interview-trainer"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </Button>
      </div>
    </div>
  );
}
