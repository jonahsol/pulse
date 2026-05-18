"use client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/react-query";
import {
  InterviewControllerContextProvider,
  UserMediaContextProvider,
} from "@/logic/context";
import { QueryClientProvider } from "@tanstack/react-query";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <UserMediaContextProvider>
          <Inner>{children}</Inner>
        </UserMediaContextProvider>
      </QueryClientProvider>
    </TooltipProvider>
  );
}

function Inner({ children }: { children: React.ReactNode }) {
  return (
    <InterviewControllerContextProvider>
      {children}
      <Toaster position="top-center" />
    </InterviewControllerContextProvider>
  );
}
