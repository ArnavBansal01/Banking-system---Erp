import type { LoanCase, Role } from "@/types/loan";
import { isCaseSlaBreached } from "./dates";

export type Action =
  | "createEnquiry"
  | "recordFollowUp"
  | "editEnquiry"
  | "setNextFollowUp"
  | "convertToApplication"
  | "review"
  | "approve"
  | "reject"
  | "query"
  | "escalate"
  | "verify"
  | "markReady"
  | "processDisbursement"
  | "hold"
  | "release"
  | "assign"
  | "reassign"
  | "recordVisit"
  | "recordPayment"
  | "resolve"
  | "addNote"
  | "resolveQuery"
  | "reopenFile"
  | "viewSlaAttention";

const OFFICER: Action[] = [
  "createEnquiry",
  "recordFollowUp",
  "editEnquiry",
  "setNextFollowUp",
  "convertToApplication",
  "verify",
  "markReady",
  "processDisbursement",
  "query",
  "resolveQuery",
  "recordVisit",
  "recordPayment",
  "escalate",
  "addNote",
];

const BRANCH_MANAGER: Action[] = [
  ...OFFICER,
  "review",
  "approve",
  "reject",
  "assign",
  "reassign",
  "hold",
  "release",
  "resolve",
];

// Regional Manager has full oversight, inherits all Branch Manager powers,
// and holds executive authority to view SLA Attention queues and re-open files
const REGIONAL_MANAGER: Action[] = [...BRANCH_MANAGER, "reopenFile", "viewSlaAttention"];

// Managing Director is the apex sanctioning authority: approves/rejects across the book,
// holds executive authority for SLA Attention and file re-opening,
// but does not escalate (apex) and does not raise operational queries.
const MD: Action[] = [
  ...BRANCH_MANAGER.filter((action) => action !== "escalate" && action !== "query"),
  "reopenFile",
  "viewSlaAttention",
];

const MATRIX: Record<Role, Action[]> = {
  Officer: OFFICER,
  "Branch Manager": BRANCH_MANAGER,
  "Area Manager": REGIONAL_MANAGER,
  "Regional Manager": REGIONAL_MANAGER,
  "General Manager": REGIONAL_MANAGER,
  "Business Head": MD,
  MD,
};

const DEFAULT_DEMO_DATE = "2026-09-02";

export function can(role: Role, action: Action, c?: LoanCase, demoDate?: string): boolean {
  if (!MATRIX[role].includes(action)) return false;
  if (!c) return true;
  switch (action) {
    case "convertToApplication":
      return c.stage === "enquiry";
    case "recordFollowUp":
      return c.stage === "enquiry" || c.stage === "active loan";
    case "editEnquiry":
      return c.stage === "enquiry";
    case "approve":
      if (c.stage !== "application" && c.stage !== "credit approved") return false;
      // If application has breached 15-day SLA, ONLY Regional Manager & MD hold sanction authority
      if (
        c.workflowStatus === "SLA Attention" ||
        isCaseSlaBreached(c, demoDate ?? DEFAULT_DEMO_DATE)
      ) {
        return (
          role === "Regional Manager" ||
          role === "Area Manager" ||
          role === "MD" ||
          role === "Business Head" ||
          role === "General Manager"
        );
      }
      // Policy deviations (e.g. low CIBIL score) exceed Branch Manager sanction limits and require Regional Manager or MD sign-off
      if (c.cibilException && role === "Branch Manager") return false;
      return true;
    case "reject":
      return c.stage === "application" || c.stage === "credit approved";
    case "review":
      return c.stage === "application";
    case "query":
      if (role === "MD") return false;
      return c.stage === "application" || c.stage === "credit approved" || c.stage === "disbursed";
    case "resolveQuery":
      return c.queryRaised || (c.queries && c.queries.some((q) => q.status === "OPEN"));
    case "verify":
    case "markReady":
      return (
        c.stage === "credit approved" &&
        c.workflowStatus !== "Disbursed" &&
        c.workflowStatus !== "SLA Attention"
      );
    case "reopenFile":
      return c.workflowStatus === "SLA Attention";
    case "viewSlaAttention":
      return true;
    case "processDisbursement":
      return (
        (c.stage === "credit approved" || c.stage === "disbursed") &&
        c.workflowStatus === "Ready for Disbursement"
      );
    case "recordPayment":
      return c.stage === "active loan" || c.stage === "disbursed";
    case "recordVisit":
      return c.stage === "active loan";
    case "resolve":
      return (
        (c.stage === "active loan" || c.stage === "disbursed") && c.workflowStatus !== "RESOLVED"
      );
    case "escalate":
      return !c.escalated && c.stage !== "recovered";
    default:
      return true;
  }
}

/** Pricing-deviation authority matrix — configurable, not scattered in the UI. */
export const DEVIATION_AUTHORITY: { maxDeviation: number; authority: string }[] = [
  { maxDeviation: 0.5, authority: "Area Sales Manager" },
  { maxDeviation: 1, authority: "Regional Sales Manager / Circle Head" },
  { maxDeviation: 2, authority: "Business Head" },
  { maxDeviation: Number.POSITIVE_INFINITY, authority: "CEO / MD" },
];

export function authorityFor(deviation: number): string {
  return DEVIATION_AUTHORITY.find((r) => deviation <= r.maxDeviation)?.authority ?? "CEO / MD";
}
