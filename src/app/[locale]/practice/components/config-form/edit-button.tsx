import { Button } from "@/components/ui/button";
import { SquarePenIcon } from "lucide-react";
import type { ComponentProps } from "react";

export function EditButton(props: ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" size="icon" {...props}>
      <SquarePenIcon />
    </Button>
  );
}
