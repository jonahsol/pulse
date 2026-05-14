import type { ReactNode } from "react";

type PopoverLayoutProps = {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
};

export function PopoverLayout({
  title,
  description,
  children,
}: PopoverLayoutProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h4 className="leading-none font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
