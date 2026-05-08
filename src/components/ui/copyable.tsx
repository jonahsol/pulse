"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useEffect, useState } from "react";

type CopyableProps = {
  children: React.ReactNode;
  copyValue: string;
  hoverTooltip: string;
  copiedTooltip: string;
};
export function Copyable({
  children,
  copyValue,
  hoverTooltip = "Copy",
  copiedTooltip = "Copied",
}: CopyableProps) {
  const [isCopied, setIsCopied] = useState(false);
  useEffect(() => {
    if (isCopied) {
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  }, [isCopied]);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyValue);
    setIsCopied(true);
  };

  return (
    <div className="flex gap-2">
      {children}
      <Tooltip>
        <TooltipContent side="bottom">
          <div className="flex items-center gap-2">
            {isCopied ? copiedTooltip : hoverTooltip}
          </div>
        </TooltipContent>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="icon"
            className="-mt-1 -mr-1"
          >
            {isCopied ? <IconCheck /> : <IconCopy />}
          </Button>
        </TooltipTrigger>
      </Tooltip>
    </div>
  );
}
