import { PulseLogo } from "@/app/components/interview-trainer/pulse-logo";
import { LocaleSwitch } from "@/app/components/locale-switch";
import { ThemeToggle } from "@/app/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconBookmark } from "@tabler/icons-react";
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
        <main
          className={`flex w-full max-w-[700px] flex-1 flex-col justify-center`}
        >
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}

async function Header() {
  const t = await getTranslations("AppShell");

  return (
    <header
      className={`flex shrink-0 items-center gap-8 px-5 py-4 md:px-8 ${HEADER_HEIGHT}`}
    >
      <Link href="/">
        <PulseLogo />
      </Link>

      <div className="flex items-center ml-auto">
        <div className="flex">
          {/* <Button
            size="sm"
            type="button"
            variant="ghost"
            data-icon="inline-start"
            asChild
          >
            <Link href="/practice">
              <IconPlus />
              {t("newSession")}
            </Link>
          </Button> */}
          <Button
            size="sm"
            type="button"
            variant="ghost"
            data-icon="inline-start"
          >
            <IconBookmark />
            {t("savedTakes")}
          </Button>
        </div>

        <Separator orientation="vertical" className="ml-6 mr-8" />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitch />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="py-4 border-t border-t-border flex flex-col items-center">
      <div className="text-sm text-muted-foreground">
        Made with ❤️ by{" "}
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
        View project on{" "}
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
    </footer>
  );
}
