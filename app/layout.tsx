import { PulseLogo } from "@/app/components/interview-trainer/pulse-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Pulse",
  description: "Timed mock interview practice with recording and review.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

type AppShellProps = {
  children: ReactNode;
};
function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col">
      <div className="h-screen">
        <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 md:px-8">
          <PulseLogo />
          <Button
            //   disabled={disableNewSession || isPreparing}
            //   onClick={onNewSession}
            size="sm"
            type="button"
            variant="ghost"
          >
            New session
          </Button>
        </header>

        <div className="flex flex-1 flex-col items-center px-5 pb-12 md:px-8">
          <div className="flex w-full max-w-[700px] flex-1 flex-col">
            <main className="bg-background text-foreground">{children}</main>
          </div>
        </div>
      </div>

      <footer className="py-4 border border-t-border flex flex-col items-center">
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
          <Button
            variant="link"
            asChild
            className="p-0"
            data-icon="inline-start"
          >
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
    </div>
  );
}
