import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataListItem {
  id: string;
  primary: ReactNode;
  secondary?: ReactNode | undefined;
  meta?: ReactNode | undefined;
  accent?: "none" | "success" | "warning" | "danger" | "info" | "review" | undefined;
}

const accentClass = {
  none: "border-l-transparent",
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-destructive",
  info: "border-l-info",
  review: "border-l-review",
};

export function DataList({
  items,
  onSelect,
  empty,
}: {
  items: DataListItem[];
  onSelect?: ((id: string) => void) | undefined;
  empty?: ReactNode | undefined;
}) {
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul className="overflow-hidden rounded-xl border border-border">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(index < items.length - 1 && "border-b border-border/50")}
        >
          <button
            type="button"
            onClick={() => onSelect?.(item.id)}
            className={cn(
              "flex w-full items-center gap-3 border-l-[3px] bg-card px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-raised",
              accentClass[item.accent ?? "none"],
            )}
          >
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[13px] font-medium text-foreground"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {item.primary}
              </p>
              {item.secondary && (
                <p
                  className="mt-0.5 truncate text-xs text-muted-foreground"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300 }}
                >
                  {item.secondary}
                </p>
              )}
            </div>
            {item.meta && <div className="flex shrink-0 items-center gap-2">{item.meta}</div>}
            {onSelect && (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function Timeline({
  events,
}: {
  events: {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    note?: string | undefined;
  }[];
}) {
  return (
    <ol className="relative space-y-4 pl-5">
      <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border" aria-hidden />
      {[...events].reverse().map((e) => (
        <li key={e.id} className="relative">
          <span
            className="absolute -left-5 top-1.5 size-2.5 rounded-full border-2 border-background bg-primary"
            aria-hidden
          />
          <div className="flex items-baseline justify-between gap-3">
            <p
              className="text-sm font-medium text-foreground"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {e.action}
            </p>
            <span
              className="num shrink-0 text-[11px] text-muted-foreground"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {e.timestamp.replace("T", " · ")}
            </span>
          </div>
          <p
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300 }}
          >
            {e.actor}
          </p>
          {e.note && (
            <p
              className="mt-1 text-xs text-muted-foreground/80"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300 }}
            >
              {e.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

export function KeyValue({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {rows.map((r) => (
        <div key={r.label} className="min-w-0">
          <dt
            className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {r.label}
          </dt>
          <dd
            className="num mt-0.5 truncate text-sm font-medium text-foreground"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({
  value,
  max,
  tone = "primary",
}: {
  value: number;
  max: number;
  tone?: "primary" | "success" | "warning" | "danger" | undefined;
}) {
  const pctValue = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const toneClass = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
  }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all duration-500", toneClass)}
        style={{ width: `${pctValue}%` }}
      />
    </div>
  );
}
