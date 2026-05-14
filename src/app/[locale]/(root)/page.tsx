import { MockUI } from "@/app/[locale]/(root)/mock-ui";
import { getTranslations } from "next-intl/server";

export default async function Landing() {
  const t = await getTranslations("Landing");
  const howItWorksSteps = t.raw("howItWorks.steps") as string[];
  const whatItTrainsItems = t.raw("whatItTrains.items") as string[];

  return (
    <div className="flex-1 flex flex-col justify-center">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <header className="space-y-3 text-center">
            <p className="text-balance text-2xl font-medium text-foreground sm:text-3xl">
              {t("headline")}
            </p>
          </header>

          <p className="text-pretty text-center text-muted-foreground">
            {t("supporting")}
          </p>
        </div>

        <MockUI />

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            {t("howItWorks.title")}
          </h2>
          <ol className="space-y-1.5 text-sm text-muted-foreground">
            {howItWorksSteps.map((step, index) => (
              <li key={step}>
                <span className="mr-2 text-foreground">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            {t("whatItTrains.title")}
          </h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {whatItTrainsItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
