"use client";
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
        // Solid surface matching reference chartCard/kpiCard — no backdrop-blur
        "rounded-2xl border border-border bg-card",
        "shadow-[0_2px_12px_rgba(0,0,0,0.18)]",
        "transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.24)]",
        padded && "p-5",
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
        <h3
          className="text-sm font-medium tracking-tight text-foreground"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {title}
        </h3>
        {count !== undefined && (
          <span
            className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
