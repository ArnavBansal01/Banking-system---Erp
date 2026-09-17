import type { CollectionUrgency, LoanCase } from "@/types/loan";

export interface CollectionState {
  urgency: CollectionUrgency;
  status: "DUE" | "OVERDUE" | "ESCALATED" | "RESOLVED";
  label: string;
  overdueDays: number;
  daysToDue: number;
  dueWindow: string;
  hasBounced: boolean;
  paidThisCycle: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y: y!, m: m!, d: d! };
}

/** Pure date engine: derives collection condition from the case due window. */
export function getCollectionState(c: LoanCase, demoDate: string): CollectionState {
  const { y, m, d } = parts(demoDate);
  const cycle = `${y}-${String(m).padStart(2, "0")}`;
  const paidThisCycle = c.emiHistory.some((e) => e.cycleMonth === cycle && e.paidDate);
  const hasBounced = c.emiHistory.some((e) => e.bounced);
  const dueWindow = `${MONTHS[m - 1]} ${c.dueDayStart} – ${MONTHS[m - 1]} ${c.dueDayEnd}`;

  if (c.workflowStatus === "RESOLVED" || paidThisCycle) {
    return {
      urgency: "resolved",
      status: "RESOLVED",
      label: "Resolved",
      overdueDays: 0,
      daysToDue: 0,
      dueWindow,
      hasBounced,
      paidThisCycle,
    };
  }

  if (c.workflowStatus === "ESCALATED") {
    return {
      urgency: "overdue",
      status: "ESCALATED",
      label: "Escalated",
      overdueDays: Math.max(0, d - c.dueDayEnd),
      daysToDue: 0,
      dueWindow,
      hasBounced,
      paidThisCycle,
    };
  }

  if (d < c.dueDayStart) {
    return {
      urgency: "healthy",
      status: "DUE",
      label: `Due in ${c.dueDayStart - d} day${c.dueDayStart - d === 1 ? "" : "s"}`,
      overdueDays: 0,
      daysToDue: c.dueDayStart - d,
      dueWindow,
      hasBounced,
      paidThisCycle,
    };
  }

  if (d <= c.dueDayEnd) {
    return {
      urgency: "due",
      status: "DUE",
      label: "Payment due",
      overdueDays: 0,
      daysToDue: 0,
      dueWindow,
      hasBounced,
      paidThisCycle,
    };
  }

  return {
    urgency: "overdue",
    status: "OVERDUE",
    label: `Overdue ${d - c.dueDayEnd}d`,
    overdueDays: d - c.dueDayEnd,
    daysToDue: 0,
    dueWindow,
    hasBounced,
    paidThisCycle,
  };
}

export const APPLICATION_SLA_DAYS = 15;

export interface SlaState {
  day: number;
  total: number;
  isBreached: boolean;
  urgency: "Normal" | "At Risk" | "Critical";
}

/** Application SLA only applies while a case is still being processed. Day of conversion is Day 1. */
export function getApplicationSla(c: LoanCase, demoDate: string): SlaState | null {
  if (!c.applicationDate) return null;
  if (c.stage === "active loan" || c.stage === "recovered") return null;
  const a = new Date(c.applicationDate + "T00:00:00Z").getTime();
  const now = new Date(demoDate + "T00:00:00Z").getTime();
  const elapsedDays = Math.max(0, Math.floor((now - a) / 86400000));
  const day = elapsedDays + 1;
  const isBreached = day > APPLICATION_SLA_DAYS || c.workflowStatus === "SLA Attention";
  const urgency = isBreached ? "Critical" : day >= 11 ? "At Risk" : "Normal";
  return { day: Math.min(day, 99), total: APPLICATION_SLA_DAYS, isBreached, urgency };
}

export const POST_APPROVAL_SLA_DAYS = 15;

export interface PostApprovalSlaState {
  day: number;
  total: number;
  isBreached: boolean;
  urgency: "Normal" | "At Risk" | "Critical";
}

/**
 * Post-Approval SLA tracks days from loan approval until documents are verified
 * and the loan is marked ready for disbursement.
 * If > 15 days have elapsed without being marked ready, SLA is breached.
 */
export function getPostApprovalSla(c: LoanCase, demoDate: string): PostApprovalSlaState | null {
  if (
    c.stage !== "credit approved" &&
    c.stage !== "disbursed" &&
    c.workflowStatus !== "SLA Attention"
  )
    return null;
  const anchorDate = c.approvalDate ?? c.applicationDate;
  if (!anchorDate) return null;

  const a = new Date(anchorDate + "T00:00:00Z").getTime();
  const now = new Date(demoDate + "T00:00:00Z").getTime();
  const elapsedDays = Math.max(0, Math.floor((now - a) / 86400000));
  const day = elapsedDays + 1;
  const isBreached = day > POST_APPROVAL_SLA_DAYS || c.workflowStatus === "SLA Attention";
  const urgency = isBreached ? "Critical" : day >= 12 ? "At Risk" : "Normal";

  return {
    day: Math.min(day, 99),
    total: POST_APPROVAL_SLA_DAYS,
    isBreached,
    urgency,
  };
}

/** Determines if a case has breached its 15-day application or post-approval SLA */
export function isCaseSlaBreached(c: LoanCase, demoDate: string): boolean {
  if (c.workflowStatus === "SLA Attention") return true;
  if (c.stage === "application") {
    const sla = getApplicationSla(c, demoDate);
    return Boolean(sla && (sla.isBreached || sla.day > APPLICATION_SLA_DAYS));
  }
  if (c.stage === "credit approved" || c.stage === "disbursed") {
    const sla = getPostApprovalSla(c, demoDate);
    return Boolean(sla && sla.isBreached);
  }
  return false;
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(to + "T00:00:00Z").getTime() - new Date(from + "T00:00:00Z").getTime()) / 86400000,
  );
}
