import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse Interview Trainer",
  description: "Timed mock interview practice with recording and review.",
};

type RootLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn("dark font-sans")} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
