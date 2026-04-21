import { Providers } from "@/app/components/providers";
import { cn } from "@/lib/utils";
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
};

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;

  return (
    <html
      lang={locale}
      className={cn("dark font-sans")}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
