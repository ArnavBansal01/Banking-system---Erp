import type { LoanCase, Role } from "@/types/loan";

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
  | "addNote";

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

// Regional Manager has full oversight and inherits all Branch Manager powers
const REGIONAL_MANAGER: Action[] = [...BRANCH_MANAGER];

// Managing Director is the supreme authority: can perform all actions across the book,
// but has no higher level to escalate to (so 'escalate' is excluded).
const MD: Action[] = BRANCH_MANAGER.filter((action) => action !== "escalate");

const MATRIX: Record<Role, Action[]> = {
  Officer: OFFICER,
  "Branch Manager": BRANCH_MANAGER,
  "Area Manager": REGIONAL_MANAGER,
  "Regional Manager": REGIONAL_MANAGER,
  "General Manager": REGIONAL_MANAGER,
  "Business Head": MD,
  MD,
};

export function can(role: Role, action: Action, c?: LoanCase): boolean {
  if (!MATRIX[role].includes(action)) return false;
  if (!c) return true;
  switch (action) {
    case "convertToApplication":
      return c.stage === "enquiry";
    case "recordFollowUp":
      return c.stage === "enquiry" || c.stage === "collections";
    case "editEnquiry":
      return c.stage === "enquiry";
    case "approve":
      if (c.stage !== "credit_review") return false;
      // Policy deviations (e.g. low CIBIL score) exceed Branch Manager sanction limits and require Regional Manager or MD sign-off
      if (c.cibilException && role === "Branch Manager") return false;
      return true;
    case "reject":
    case "review":
      return c.stage === "credit_review";
    case "query":
      return c.stage === "credit_review" || c.stage === "disbursement";
    case "verify":
    case "markReady":
      return c.stage === "disbursement" && c.workflowStatus !== "Disbursed";
    case "processDisbursement":
      return c.stage === "disbursement" && c.workflowStatus === "Ready for Disbursement";
    case "recordPayment":
    case "recordVisit":
      return c.stage === "collections";
    case "resolve":
      return c.stage === "collections" && c.workflowStatus !== "RESOLVED";
    case "escalate":
      return !c.escalated && c.stage !== "closed";
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
