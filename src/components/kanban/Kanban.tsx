import { Inbox } from "lucide-react";
import { useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/Controls";

export function KanbanBoard({ children }: { children: ReactNode }) {
  return <div className="flex gap-4 overflow-x-auto pb-2">{children}</div>;
}

export function KanbanColumn({
  title,
  count,
  accent = "neutral",
  emptyLabel = "No cases pending",
  onDropCase,
  children,
}: {
  title: string;
  count: number;
  accent?: "neutral" | "success" | "warning" | "danger" | "info" | "review" | undefined;
  emptyLabel?: string | undefined;
  onDropCase?: ((caseId: string) => void) | undefined;
  children: ReactNode;
}) {
  const [isOver, setIsOver] = useState(false);

  const dot = {
    neutral: "bg-muted-foreground",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    info: "bg-info",
    review: "bg-review",
  }[accent];

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    if (onDropCase) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!isOver) setIsOver(true);
    }
  };

  const handleDragLeave = () => {
    if (isOver) setIsOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    if (onDropCase) {
      e.preventDefault();
      setIsOver(false);
      const caseId = e.dataTransfer.getData("text/plain");
      if (caseId) {
        onDropCase(caseId);
      }
    }
  };

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex min-w-[300px] flex-1 flex-col rounded-2xl border transition-all duration-150",
        isOver
          ? "border-primary/60 bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.12)]",
      )}
    >
      {/* Column header — solid muted bg matching reference */}
      <header className="flex items-center justify-between gap-2 rounded-t-2xl border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", dot)} aria-hidden />
          <h3
            className="text-sm font-medium text-foreground"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {title}
          </h3>
        </div>
        <span
          className="rounded-md bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground border border-border"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {count}
        </span>
      </header>
      <div className="flex flex-col gap-2 p-3 min-h-[160px]">
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
  caseId,
  accent = "none",
  draggable = true,
  onDragStart,
  onDragEnd,
  children,
}: {
  onClick: () => void;
  caseId?: string | undefined;
  accent?: "none" | "success" | "warning" | "danger" | "info" | "review" | undefined;
  draggable?: boolean | undefined;
  onDragStart?: ((e: DragEvent<HTMLButtonElement>) => void) | undefined;
  onDragEnd?: ((e: DragEvent<HTMLButtonElement>) => void) | undefined;
  children: ReactNode;
}) {
  const border = {
    none: "border-l-border/40",
    success: "border-l-success",
    warning: "border-l-warning",
    danger: "border-l-destructive",
    info: "border-l-info",
    review: "border-l-review",
  }[accent];

  const handleDragStart = (e: DragEvent<HTMLButtonElement>) => {
    if (caseId) {
      e.dataTransfer.setData("text/plain", caseId);
      e.dataTransfer.effectAllowed = "move";
    }
    onDragStart?.(e);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        // Solid card matching reference stepCard pattern
        "w-full rounded-xl border border-border border-l-[3px] bg-background p-3.5 text-left",
        "transition-all duration-200 cursor-grab active:cursor-grabbing",
        "hover:border-border-strong hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.18)]",
        border,
      )}
    >
      {children}
    </button>
  );
}

export function CardRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return <div className={cn("flex items-center justify-between gap-2", className)}>{children}</div>;
}
