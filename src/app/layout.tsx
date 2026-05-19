import { cn } from "@/lib/utils";
import { ClientProviders } from "@/providers/client";
import { ServerProviders } from "@/providers/server";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse — Practice interviews under pressure",
  description:
    "Train interview performance under pressure. 5-second countdown, timed responses, recording, and structured review to improve clarity and delivery.",
};

type RootLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
  //   params: Promise<{ locale: string }>;
};

export default async function RootLayout({
  children,
  //   params,
}: RootLayoutProps) {
  //   const { locale } = await params;

  return (
    <html
      //   lang={locale}
      className={cn("dark font-sans")}
      suppressHydrationWarning
    >
      <body>
        <ServerProviders>
          <ClientProviders>{children}</ClientProviders>
        </ServerProviders>
      </body>
    </html>
  );
}
