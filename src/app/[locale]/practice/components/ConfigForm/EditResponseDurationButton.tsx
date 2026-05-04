import { EditPopoverButton } from "@/app/[locale]/practice/components/ConfigForm/EditPopoverButton";
import { PopoverLayout } from "@/app/[locale]/practice/components/ConfigForm/PopoverLayout";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { responseDurationConfigAtom } from "@/logic/atoms";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

export function EditResponseDurationButton(
  props: ComponentProps<typeof Button>,
) {
  const t = useTranslations("InterviewConfig");
  const [responseDurationInput, setResponseDurationInput] = useAtom(
    responseDurationConfigAtom,
  );
  function handleValueChange(value: string) {
    if (value) {
      setResponseDurationInput(Number(value));
    }
  }
  return (
    <EditPopoverButton {...props}>
      <PopoverLayout
        title={t("responseDuration.title")}
        description={t("responseDuration.description")}
      >
        <ToggleGroup
          type="single"
          variant="outline"
          value={responseDurationInput.toString()}
          onValueChange={handleValueChange}
        >
          <ToggleGroupItem value="45">45s</ToggleGroupItem>
          <ToggleGroupItem value="60">60s</ToggleGroupItem>
          <ToggleGroupItem value="90">90s</ToggleGroupItem>
        </ToggleGroup>
      </PopoverLayout>
    </EditPopoverButton>
  );
}
