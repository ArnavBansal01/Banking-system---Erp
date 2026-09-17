import type { LoanCase, Stage, WorkflowStatus } from "@/types/loan";

/** Centralised lifecycle transitions. Modules never invent their own. */
export interface Transition {
  stage: Stage;
  status: WorkflowStatus;
  event: string;
}

export const TRANSITIONS = {
  convertToApplication: {
    stage: "application",
    status: "New",
    event: "Application created",
  },
  startReview: {
    stage: "application",
    status: "In Review",
    event: "Credit review started",
  },
  creditReady: {
    stage: "application",
    status: "Ready",
    event: "Credit assessment ready",
  },
  approve: {
    stage: "credit approved",
    status: "Verification",
    event: "Approved by credit authority",
  },
  reject: {
    stage: "recovered",
    status: "RESOLVED",
    event: "Application rejected",
  },
  markReady: {
    stage: "credit approved",
    status: "Ready for Disbursement",
    event: "Verification completed",
  },
  reopenFile: {
    stage: "credit approved",
    status: "Verification",
    event: "File re-opened by executive authority",
  },
  disburse: {
    stage: "disbursed",
    status: "DUE",
    event: "Disbursement processed",
  },
  activateLoan: {
    stage: "active loan",
    status: "DUE",
    event: "Loan active in collections",
  },
  resolve: {
    stage: "recovered",
    status: "RESOLVED",
    event: "Case resolved",
  },
  escalate: {
    stage: "active loan",
    status: "ESCALATED",
    event: "Case escalated",
  },
} satisfies Record<string, Transition>;

export const LOAN_STAGES: Stage[] = [
  "enquiry",
  "application",
  "credit approved",
  "disbursed",
  "active loan",
  "recovered",
];

export const STAGE_LABELS: Record<Stage, string> = {
  enquiry: "Enquiry",
  application: "Application",
  "credit approved": "Credit Approved",
  disbursed: "Disbursed",
  "active loan": "Active Loan",
  recovered: "Recovered",
};

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
  return c.stage === "active loan" || c.stage === "disbursed";
}
