"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

type CopyableProps = {
  copyValue: string;
  hoverTooltip: string;
  copiedTooltip: string;
};
export function CopyButton({
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
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </TooltipTrigger>
    </Tooltip>
  );
}
