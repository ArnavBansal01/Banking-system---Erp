import type { ReactNode } from "react";
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
}: {
  label: string;
  value: ReactNode;
  support?: string | undefined;
  icon?: ReactNode | undefined;
  status?: KpiStatus | undefined;
  onClick?: (() => void) | undefined;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      {...(onClick ? { onClick, type: "button" as const } : {})}
      className={cn(
        "group flex w-full flex-col gap-2 rounded-xl border border-border bg-card/70 p-3.5 text-left backdrop-blur-md transition-all duration-200",
        onClick && "hover:border-border-strong hover:bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className={cn("grid size-7 place-items-center rounded-lg", iconTone[status])}>
            {icon}
          </span>
        )}
      </div>
      <span className={cn("num text-2xl font-bold leading-none", valueTone[status])}>{value}</span>
      {support && <span className="text-xs text-muted-foreground">{support}</span>}
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
