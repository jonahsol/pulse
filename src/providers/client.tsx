"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/react-query";
import {
  InterviewContextProvider,
  InterviewRuntimeContextProvider,
} from "@/logic/context";
import { QueryClientProvider } from "@tanstack/react-query";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <InterviewContextProvider>
          <InterviewRuntimeContextProvider>
            {children}
          </InterviewRuntimeContextProvider>
        </InterviewContextProvider>
      </QueryClientProvider>
    </TooltipProvider>
  );
}
