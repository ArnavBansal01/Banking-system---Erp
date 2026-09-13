import type { ReactNode } from "react";
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
        "group relative flex w-full flex-col gap-2 rounded-xl border p-3.5 text-left transition-all duration-200 select-none",
        isClickable
          ? "cursor-pointer border-border/90 bg-card/85 shadow-2xs hover:border-primary/60 hover:bg-surface-raised hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          : "cursor-default border-border/50 bg-card/45 opacity-95",
        isActive && "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
              isActive
                ? "text-primary font-bold"
                : isClickable
                  ? "text-muted-foreground group-hover:text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {label}
          </span>
          {isClickable && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wide transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary",
              )}
            >
              <span>{isActive ? "Filtered" : clickHint}</span>
              <ArrowUpRight className="size-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          )}
        </div>

        {icon && (
          <span
            className={cn(
              "grid size-7 place-items-center rounded-lg shrink-0 transition-transform duration-200",
              iconTone[status],
              isClickable && "group-hover:scale-105",
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <span className={cn("num text-2xl font-bold leading-none", valueTone[status])}>{value}</span>

      {support && <span className="text-xs text-muted-foreground leading-tight">{support}</span>}
    </Comp>
  );
}

export function KPIGroup({
  children,
  cols = 5,
}: {
  children: ReactNode;
  cols?: number | undefined;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        cols === 4
          ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          : cols === 6
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
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
    <div className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur-md">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {value && <span className="num text-lg font-bold text-foreground">{value}</span>}
      </div>
      {children && <div className="mt-3">{children}</div>}
      {footer && <div className="mt-3 text-xs text-muted-foreground">{footer}</div>}
    </div>
  );
}
