"use client";
import React, { type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiStatus = "neutral" | "success" | "warning" | "danger" | "info";

const valueTone: Record<KpiStatus, string> = {
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
};

const iconTone: Record<KpiStatus, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-destructive/12 text-destructive",
  info: "bg-info/12 text-info",
};

export function KPI({
  label,
  value,
  support,
  icon,
  status = "neutral",
  onClick,
  isActive = false,
  clickHint = "Filter",
}: {
  label: string;
  value: ReactNode;
  support?: string | undefined;
  icon?: ReactNode | undefined;
  status?: KpiStatus | undefined;
  onClick?: (() => void) | undefined;
  isActive?: boolean | undefined;
  clickHint?: string | undefined;
}) {
  const isClickable = Boolean(onClick);
  const Comp = isClickable ? "button" : "div";

  return (
    <Comp
      {...(isClickable ? { onClick, type: "button" as const } : {})}
      className={cn(
        // Base: solid card surface matching reference kpiCard
        "group relative flex w-full flex-col gap-3 rounded-2xl border p-5 text-left select-none",
        "transition-all duration-200",
        isClickable
          ? [
              "cursor-pointer",
              "border-border bg-card",
              "shadow-[0_2px_12px_rgba(0,0,0,0.15)]",
              "hover:border-border-strong hover:shadow-[0_6px_20px_rgba(0,0,0,0.22)] hover:-translate-y-0.5",
              "active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            ].join(" ")
          : "cursor-default border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.10)]",
        isActive && "border-primary/60 ring-1 ring-primary/30 bg-primary/[0.04]",
      )}
    >
      {/* Top row: label + click hint pill + icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase transition-colors",
              isActive
                ? "text-primary"
                : isClickable
                  ? "text-muted-foreground group-hover:text-foreground"
                  : "text-muted-foreground",
            )}
            style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.08em" }}
          >
            {label}
          </span>
          {isClickable && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary",
              )}
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              <span>{isActive ? "Filtered" : clickHint}</span>
              <ArrowUpRight className="size-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          )}
        </div>

        {icon && (
          <span
            className={cn(
              "grid size-8 place-items-center rounded-xl shrink-0 transition-transform duration-200",
              iconTone[status],
              isClickable && "group-hover:scale-105",
            )}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Large thin figure — matches reference largeThinFigure */}
      <span
        className={cn("num leading-none", valueTone[status])}
        style={{
          fontFamily: "Outfit, sans-serif",
          fontSize: "2.25rem",
          fontWeight: 300,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </span>

      {support && (
        <span
          className="text-xs text-muted-foreground leading-tight"
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300 }}
        >
          {support}
        </span>
      )}
    </Comp>
  );
}

export function KPIGroup({
  children,
  cols,
}: {
  children: ReactNode;
  cols?: number | undefined;
}) {
  const count = React.Children.count(children);
  const effectiveCols = cols ?? (count === 4 ? 4 : count === 6 ? 6 : count || 4);

  return (
    <div
      className={cn(
        "grid gap-4 w-full",
        effectiveCols === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        effectiveCols === 6 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
        effectiveCols === 5 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        effectiveCols === 3 && "grid-cols-1 sm:grid-cols-3",
        effectiveCols === 2 && "grid-cols-1 sm:grid-cols-2",
        effectiveCols === 1 && "grid-cols-1",
      )}
    >
      {children}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  footer,
  children,
}: {
  title: string;
  value?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  children?: ReactNode | undefined;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
      <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-border">
        <h3
          className="text-[13px] font-medium text-muted-foreground"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {title}
        </h3>
        {value && (
          <span
            className="num leading-none text-foreground"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "1.5rem",
              fontWeight: 300,
              letterSpacing: "-0.03em",
            }}
          >
            {value}
          </span>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
      {footer && (
        <div
          className="mt-3 text-xs text-muted-foreground"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
