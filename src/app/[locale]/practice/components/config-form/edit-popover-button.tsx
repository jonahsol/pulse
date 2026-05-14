import { EditButton } from "@/app/[locale]/practice/components/config-form/edit-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ComponentProps } from "react";

type EditPopoverButtonProps = {
  children: React.ReactNode;
} & ComponentProps<typeof EditButton>;
export function EditPopoverButton({
  children,
  ...rest
}: EditPopoverButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <EditButton {...rest} />
      </PopoverTrigger>
      <PopoverContent className="w-80">{children}</PopoverContent>
    </Popover>
  );
}
