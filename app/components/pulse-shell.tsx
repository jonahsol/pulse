"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type PulseShellProps = {
  children: ReactNode;
  disableNewSession?: boolean;
  isPreparing?: boolean;
  onNewSession: () => void;
};

export function PulseShell({
  children,
  disableNewSession = false,
  isPreparing = false,
  onNewSession,
}: PulseShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 md:px-8">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Pulse
        </span>
        <Button
          disabled={disableNewSession || isPreparing}
          onClick={onNewSession}
          size="sm"
          type="button"
          variant="ghost"
        >
          New session
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center px-5 pb-12 md:px-8">
        <div className="flex w-full max-w-[700px] flex-1 flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
