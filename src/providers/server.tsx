import { ThemeProvider } from "@/app/[locale]/(root)/theme-provider";
import { NextIntlClientProvider } from "next-intl";

export function ServerProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
