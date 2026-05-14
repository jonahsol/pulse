import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

type QuestionTitleProps = {
  children: React.ReactNode;
  className?: string;
} & React.ComponentProps<"div">;
const QuestionTitle = forwardRef<HTMLDivElement, QuestionTitleProps>(
  ({ children, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("border-l-2 border-border pl-3", className)}
        {...rest}
      >
        <CardTitle className="text-xl font-medium ">{children}</CardTitle>
      </div>
    );
  },
);

type HeaderProps = {
  children: React.ReactNode;
  className?: string;
  withSeparator?: boolean;
};
function Header({ children, className, withSeparator = true }: HeaderProps) {
  return (
    <CardHeader
      className={cn(
        "flex flex-col gap-7 items-stretch px-0 space-y-0",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-6">
        {children}
      </div>
      {withSeparator && <Separator />}
    </CardHeader>
  );
}

type QuestionCardProps = {
  children: React.ReactNode;
  className?: string;
};
function Outer({ children, className }: QuestionCardProps) {
  return (
    <Card
      className={cn(
        "border-border/80 bg-card/90 shadow-none backdrop-blur-sm gap-7 py-6",
        className,
      )}
    >
      {children}
    </Card>
  );
}

type ContentProps = {
  children: React.ReactNode;
  className?: string;
};
function Content({ children, className }: ContentProps) {
  return (
    <CardContent className={cn("space-y-4 p-0 -mb-4", className)}>
      {children}
    </CardContent>
  );
}

export const QuestionCard = {
  QuestionTitle,
  Header,
  Outer,
  Content,
};
