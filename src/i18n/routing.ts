import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "pt", "fr", "de"],
  defaultLocale: "en",
});

export type AppLocale = (typeof routing.locales)[number];
