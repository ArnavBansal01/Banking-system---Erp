import { AlertTriangle, MessageSquare, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Priority, Temperature } from "@/types/loan";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "review";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  danger: "bg-destructive/14 text-destructive border-destructive/28",
  info: "bg-info/14 text-info border-info/28",
  review: "bg-review/14 text-review border-review/28",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tracking-wide",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  "New Enquiry": "info",
  Contacted: "info",
  Interested: "success",
  New: "info",
  "In Review": "review",
  Ready: "success",
  Verification: "warning",
  "Ready for Disbursement": "success",
  Disbursements: "info",
  Disbursed: "success",
  DUE: "warning",
  OVERDUE: "danger",
  ESCALATED: "danger",
  RESOLVED: "success",
};

export function StatusBadge({ status, className }: { status: string; className?: string | undefined }) {
  return (
    <Badge tone={statusTone[status] ?? "neutral"} className={className}>
      {status}
    </Badge>
  );
}

const priorityTone: Record<Priority, Tone> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "neutral",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={priorityTone[priority]}>{priority}</Badge>;
}

const tempTone: Record<Temperature, Tone> = { Hot: "danger", Warm: "warning", Cold: "info" };

export function TemperatureBadge({ temperature }: { temperature: Temperature }) {
  return <Badge tone={tempTone[temperature]}>{temperature}</Badge>;
}

export function QueryBadge() {
  return (
    <Badge tone="info">
      <MessageSquare className="size-3" aria-hidden />
      Query
    </Badge>
  );
}

export function ExceptionBadge({ label = "CIBIL exception" }: { label?: string }) {
  return (
    <Badge tone="review">
      <ShieldAlert className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

export function BouncedBadge() {
  return (
    <span
      title="Previous payment bounced"
      className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/12 px-1.5 py-0.5 text-[11px] font-semibold text-warning"
    >
      <AlertTriangle className="size-3" aria-hidden />
      Bounced
    </span>
  );
}

export function SlaBadge({
  day,
  total,
  urgency,
}: {
  day: number;
  total: number;
  urgency: "Normal" | "At Risk" | "Critical";
}) {
  const tone: Tone = urgency === "Critical" ? "danger" : urgency === "At Risk" ? "warning" : "success";
  return (
    <Badge tone={tone} className="num">
      Day {day}/{total}
    </Badge>
  );
}
