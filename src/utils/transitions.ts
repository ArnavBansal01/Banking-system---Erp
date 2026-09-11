import type { LoanCase, Stage, WorkflowStatus } from "@/types/loan";

/** Centralised lifecycle transitions. Modules never invent their own. */
export interface Transition {
  stage: Stage;
  status: WorkflowStatus;
  event: string;
}

export const TRANSITIONS = {
  convertToApplication: { stage: "credit_review", status: "New", event: "Application created" },
  startReview: { stage: "credit_review", status: "In Review", event: "Credit review started" },
  creditReady: { stage: "credit_review", status: "Ready", event: "Credit assessment ready" },
  approve: { stage: "disbursement", status: "Verification", event: "Approved by credit authority" },
  reject: { stage: "closed", status: "RESOLVED", event: "Application rejected" },
  markReady: {
    stage: "disbursement",
    status: "Ready for Disbursement",
    event: "Verification completed",
  },
  reopenFile: {
    stage: "disbursement",
    status: "Verification",
    event: "File re-opened by executive authority",
  },
  disburse: { stage: "collections", status: "DUE", event: "Disbursement processed" },
  resolve: { stage: "collections", status: "RESOLVED", event: "Case resolved" },
  escalate: { stage: "collections", status: "ESCALATED", event: "Case escalated" },
} satisfies Record<string, Transition>;

export const EMMS_COLUMNS: WorkflowStatus[] = ["New Enquiry", "Contacted", "Interested"];
export const CREDIT_COLUMNS: WorkflowStatus[] = ["New", "In Review", "Ready", "SLA Attention"];
export const OPS_COLUMNS: WorkflowStatus[] = [
  "Verification",
  "Ready for Disbursement",
  "Disbursements",
  "SLA Attention",
];

export const COLUMN_LABELS: Partial<Record<WorkflowStatus, string>> = {
  "New Enquiry": "New Enquiry",
  Contacted: "Contacted / In Discussion",
  Interested: "Interested",
  New: "New",
  "In Review": "In Review",
  Ready: "Ready",
  Verification: "Verification",
  "Ready for Disbursement": "Ready",
  Disbursements: "Disbursements",
  "SLA Attention": "SLA Attention (>15d)",
};

export function nextEmmsStatus(status: WorkflowStatus): WorkflowStatus | null {
  const i = EMMS_COLUMNS.indexOf(status);
  return i >= 0 && i < EMMS_COLUMNS.length - 1 ? EMMS_COLUMNS[i + 1]! : null;
}

export function isActiveLoan(c: LoanCase): boolean {
  return c.stage === "collections";
}
