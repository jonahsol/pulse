import { EditPopoverButton } from "@/app/[locale]/practice/components/ConfigForm/EditPopoverButton";
import { PopoverLayout } from "@/app/[locale]/practice/components/ConfigForm/PopoverLayout";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { countdownDurationConfigAtom } from "@/logic/atoms";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { ComponentProps } from "react";

export function EditCountdownDurationButton(
  props: ComponentProps<typeof Button>,
) {
  const t = useTranslations("InterviewConfig");
  const [countdownDurationInput, setCountdownDurationInput] = useAtom(
    countdownDurationConfigAtom,
  );
  function handleValueChange(value: string) {
    if (value) {
      setCountdownDurationInput(Number(value));
    }
  }

  return (
    <EditPopoverButton {...props}>
      <PopoverLayout
        title={t("countdownDuration.title")}
        description={t("countdownDuration.description")}
      >
        <ToggleGroup
          type="single"
          variant="outline"
          value={countdownDurationInput.toString()}
          onValueChange={handleValueChange}
        >
          <ToggleGroupItem value="3">3s</ToggleGroupItem>
          <ToggleGroupItem value="5">5s</ToggleGroupItem>
          <ToggleGroupItem value="10">10s</ToggleGroupItem>
        </ToggleGroup>
      </PopoverLayout>
    </EditPopoverButton>
  );
}
