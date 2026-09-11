import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/Controls";

export function KanbanBoard({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {children}
    </div>
  );
}

export function KanbanColumn({
  title,
  count,
  accent = "neutral",
  emptyLabel = "No cases pending",
  children,
}: {
  title: string;
  count: number;
  accent?: "neutral" | "success" | "warning" | "danger" | "info" | "review" | undefined;
  emptyLabel?: string | undefined;
  children: ReactNode;
}) {
  const dot = {
    neutral: "bg-muted-foreground",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    info: "bg-info",
    review: "bg-review",
  }[accent];

  return (
    <section className="flex min-w-[290px] flex-1 flex-col rounded-xl border border-border bg-surface/40 backdrop-blur-md">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <span className="num rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {count}
        </span>
      </header>
      <div className="flex flex-col gap-2 p-2">
        {count === 0 ? (
          <EmptyState compact title={emptyLabel} icon={<Inbox className="size-5" />} />
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export function KanbanCard({
  onClick,
  accent = "none",
  children,
}: {
  onClick: () => void;
  accent?: "none" | "success" | "warning" | "danger" | "info" | "review" | undefined;
  children: ReactNode;
}) {
  const border = {
    none: "border-l-border",
    success: "border-l-success",
    warning: "border-l-warning",
    danger: "border-l-destructive",
    info: "border-l-info",
    review: "border-l-review",
  }[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-border border-l-2 bg-card/80 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-card",
        border,
      )}
    >
      {children}
    </button>
  );
}

export function CardRow({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return <div className={cn("flex items-center justify-between gap-2", className)}>{children}</div>;
}
