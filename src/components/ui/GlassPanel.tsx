import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: ReactNode;
  className?: string | undefined;
  accent?: "none" | "success" | "warning" | "danger" | "info" | "review" | "primary" | undefined;
  padded?: boolean | undefined;
}

const accentClass: Record<NonNullable<GlassPanelProps["accent"]>, string> = {
  none: "",
  success: "border-l-2 border-l-success",
  warning: "border-l-2 border-l-warning",
  danger: "border-l-2 border-l-destructive",
  info: "border-l-2 border-l-info",
  review: "border-l-2 border-l-review",
  primary: "border-l-2 border-l-primary",
};

export function GlassPanel({
  children,
  className,
  accent = "none",
  padded = true,
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/70 shadow-panel backdrop-blur-md",
        padded && "p-4",
        accentClass[accent],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  count,
  action,
  icon,
}: {
  title: string;
  count?: number | undefined;
  action?: ReactNode | undefined;
  icon?: ReactNode | undefined;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {count !== undefined && (
          <span className="num rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
