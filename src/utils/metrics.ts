import type { LoanCase } from "@/types/loan";
import { getApplicationSla, getCollectionState } from "./dates";

export function sum(list: number[]): number {
  return list.reduce((a, b) => a + b, 0);
}

export interface CollectionBuckets {
  due: LoanCase[];
  overdue: LoanCase[];
  escalated: LoanCase[];
  resolved: LoanCase[];
  bounced: LoanCase[];
  missedFollowUps: LoanCase[];
}

export function collectionBuckets(cases: LoanCase[], demoDate: string): CollectionBuckets {
  const active = cases.filter((c) => c.stage === "active loan" || c.stage === "disbursed");
  const b: CollectionBuckets = {
    due: [],
    overdue: [],
    escalated: [],
    resolved: [],
    bounced: [],
    missedFollowUps: [],
  };
  for (const c of active) {
    const s = getCollectionState(c, demoDate);
    if (s.status === "RESOLVED" || c.stage === "recovered") b.resolved.push(c);
    else if (s.status === "ESCALATED") b.escalated.push(c);
    else if (s.status === "OVERDUE") b.overdue.push(c);
    else b.due.push(c);
    if (s.hasBounced) b.bounced.push(c);
    if (
      s.status !== "RESOLVED" &&
      c.nextFollowUp === null &&
      (s.status === "OVERDUE" || s.urgency === "due")
    )
      b.missedFollowUps.push(c);
  }
  return b;
}

export interface Metrics {
  totalCases: number;
  enquiries: number;
  applications: number;
  conversionRate: number;
  totalLoanValue: number;
  avgTicket: number;
  activeApplications: number;
  pendingCredit: number;
  underReview: number;
  queries: number;
  creditReady: number;
  slaAtRisk: number;
  slaCritical: number;
  opsReceived: number;
  opsProcessing: number;
  opsReady: number;
  opsDisbursed: number;
  totalDisbursed: number;
  activeLoans: number;
  overdueCount: number;
  overdueAmount: number;
  dueCount: number;
  resolvedCount: number;
  escalations: number;
  cibilExceptions: number;
  avgRate: number;
  target: number;
}

export function computeMetrics(cases: LoanCase[], demoDate: string): Metrics {
  const enquiries = cases.filter((c) => c.stage === "enquiry");
  const credit = cases.filter((c) => c.stage === "application" || c.stage === "credit approved");
  const ops = cases.filter((c) => c.stage === "credit approved" || c.stage === "disbursed");
  const collections = cases.filter((c) => c.stage === "active loan" || c.stage === "recovered");
  const converted = cases.filter((c) => c.stage !== "enquiry");
  const buckets = collectionBuckets(cases, demoDate);
  const pipeline = [...credit, ...ops];
  const slas = pipeline.map((c) => getApplicationSla(c, demoDate));
  const disbursedCases = cases.filter(
    (c) => c.disbursedAmount > 0 || c.stage === "disbursed" || c.stage === "active loan",
  );
  const totalDisbursed = sum(disbursedCases.map((c) => c.disbursedAmount || c.loanAmount));

  return {
    totalCases: cases.length,
    enquiries: enquiries.length,
    applications: converted.length,
    conversionRate: cases.length ? (converted.length / cases.length) * 100 : 0,
    totalLoanValue: sum(cases.map((c) => c.loanAmount)),
    avgTicket: cases.length ? sum(cases.map((c) => c.loanAmount)) / cases.length : 0,
    activeApplications: pipeline.length,
    pendingCredit: credit.length,
    underReview: credit.filter((c) => c.workflowStatus === "In Review").length,
    queries: credit.filter((c) => c.queryRaised).length,
    creditReady: credit.filter((c) => c.workflowStatus === "Ready").length,
    slaAtRisk: slas.filter((s) => s?.urgency === "At Risk").length,
    slaCritical: slas.filter((s) => s?.urgency === "Critical").length,
    opsReceived: ops.length,
    opsProcessing: ops.filter((c) => c.workflowStatus === "Verification").length,
    opsReady: ops.filter((c) => c.workflowStatus === "Ready for Disbursement").length,
    opsDisbursed: ops.filter((c) => c.workflowStatus === "Disbursements").length,
    totalDisbursed,
    activeLoans: collections.length,
    overdueCount: buckets.overdue.length,
    overdueAmount: sum(buckets.overdue.map((c) => c.emiAmount)),
    dueCount: buckets.due.length,
    resolvedCount: buckets.resolved.length,
    escalations: buckets.escalated.length,
    cibilExceptions: cases.filter((c) => c.cibilException).length,
    avgRate: cases.length ? sum(cases.map((c) => c.terms.interestRate)) / cases.length : 0,
    target: Math.round((totalDisbursed || 1) * 1.35),
  };
}

/** Disbursement trend derived from disbursed cases, grouped by month. */
export function disbursementTrend(cases: LoanCase[]): { month: string; value: number }[] {
  const map = new Map<string, number>();
  for (const c of cases) {
    if (!c.disbursedDate) continue;
    const key = c.disbursedDate.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + c.disbursedAmount);
  }
  return [...map.entries()].sort().map(([month, value]) => ({ month, value }));
}
