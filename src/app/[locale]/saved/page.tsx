import { SavedTakesGrid } from "@/app/[locale]/saved/saved-takes-grid";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function SavedTakesPage() {
  const t = useTranslations("SavedTakesPage");

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-card/80 shadow-none backdrop-blur-sm">
        <CardHeader className="gap-1 space-y-0 px-5 flex flex-col">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
      </Card>
      <SavedTakesGrid />
    </div>
  );
}
