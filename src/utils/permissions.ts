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
  "verify",
  "markReady",
  "processDisbursement",
  "assign",
  "reassign",
  "hold",
  "release",
  "resolve",
];

// Regional Manager has full oversight, inherits all Branch Manager powers,
// and holds executive authority to view SLA Attention queues and re-open files
const REGIONAL_MANAGER: Action[] = [...BRANCH_MANAGER, "reopenFile", "viewSlaAttention"];

// Business Head inherits Regional Manager powers and can raise queries to MD
const BUSINESS_HEAD: Action[] = [
  ...BRANCH_MANAGER.filter((action) => action !== "escalate"),
  "reopenFile",
  "viewSlaAttention",
];

// Managing Director is the apex sanctioning authority: approves/rejects across the book,
// holds executive authority for SLA Attention and file re-opening,
// but does not escalate (apex) and CANNOT raise operational queries.
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
  "Business Head": BUSINESS_HEAD,
  MD,
};

export const ROLE_HIERARCHY_LEVEL: Record<Role, number> = {
  Officer: 1,
  "Branch Manager": 2,
  "Area Manager": 3,
  "Regional Manager": 4,
  "General Manager": 5,
  "Business Head": 6,
  MD: 7,
};

/**
 * Maps each role to the one-level-higher post(s) that receive its queries.
 * Managing Director (MD) is the apex authority and cannot raise queries.
 */
export function getNextHigherRoles(role: Role): Role[] {
  switch (role) {
    case "Officer":
      return ["Branch Manager"];
    case "Branch Manager":
      return ["Area Manager"];
    case "Area Manager":
      return ["Regional Manager"];
    case "Regional Manager":
      return ["General Manager"];
    case "General Manager":
      return ["Business Head"];
    case "Business Head":
      return ["MD"];
    case "MD":
      return []; // MD cannot raise queries
    default:
      return ["Branch Manager"];
  }
}

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
      // An already approved loan can NOT show the approve option again
      if (c.stage !== "application") return false;
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
        c.workflowStatus !== "Ready for Disbursement"
      );
    case "reopenFile":
      return c.workflowStatus === "SLA Attention";
    case "viewSlaAttention":
      return true;
    case "processDisbursement":
      return c.stage === "credit approved" || c.stage === "disbursed";
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
