import type { EmiRecord, RawStage } from "@/data/mockData";

export type { EmiRecord };

export type Stage = RawStage | "active_loan";

export type Role =
  | "MD"
  | "Business Head"
  | "Regional Manager"
  | "Area Manager"
  | "Branch Manager"
  | "General Manager"
  | "Officer";

export type ModuleView = "EMMS" | "Credit" | "AMS" | "Collections" | "Management";

/** Workflow status: the column a case sits in, per module. */
export type WorkflowStatus =
  // enquiry
  | "New Enquiry"
  | "Contacted"
  | "Interested"
  // credit
  | "New"
  | "In Review"
  | "Ready"
  // operations
  | "Verification"
  | "Ready for Disbursement"
  | "Disbursements"
  | "Disbursed"
  // collections (lifecycle status)
  | "DUE"
  | "OVERDUE"
  | "ESCALATED"
  | "RESOLVED";

export type Priority = "Critical" | "High" | "Medium" | "Low";
export type Temperature = "Hot" | "Warm" | "Cold";
export type CollectionQueue = "followup" | "visit" | "payment" | "none";
export type CollectionUrgency = "healthy" | "due" | "overdue" | "resolved";

export interface DocumentItem {
  name: string;
  received: boolean;
}

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

export interface CreditInfo {
  cibil: number;
  existingLoans: number;
  existingObligations: number;
  defaults: number;
  overdueAmount: number;
  riskLevel: "Low" | "Moderate" | "High";
  recommendation: string;
}

export interface Financials {
  annualRevenue: number;
  netCashFlow: number;
  existingObligations: number;
  repaymentCapacity: number;
}

export interface LoanTerms {
  product: string;
  tenureMonths: number;
  interestRate: number;
  approvedRate?: number | undefined;
  repayment: string;
  bankAccount: string;
}

export interface Applicant {
  entityType: string;
  contact: string;
  email: string;
  business: string;
  purpose: string;
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  note?: string | undefined;
}

export interface ExceptionRecord {
  id: string;
  type: string;
  deviation?: number | undefined;
  authority: string;
  decision: "Pending" | "Approved" | "Rejected";
  reason?: string | undefined;
  timestamp: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  mode: string;
}

export interface LoanCase {
  id: string;
  clientName: string;
  loanAmount: number;
  emiAmount: number;
  outstanding: number;

  stage: Stage;
  workflowStatus: WorkflowStatus;

  // conditions (not columns)
  queryRaised: boolean;
  escalated: boolean;
  cibilException: boolean;
  priority: Priority;

  // geography / ownership
  region: string;
  area: string;
  branch: string;
  assignedOfficer: string;

  // sales
  temperature: Temperature;
  followUpCount: number;
  nextFollowUp: string | null;
  lastFollowUp: string | null;

  // application SLA
  applicationDate: string | null;
  disbursedDate: string | null;
  disbursedAmount: number;

  // collections
  dueDayStart: number;
  dueDayEnd: number;
  emiHistory: EmiRecord[];
  payments: PaymentRecord[];
  visits: { id: string; date: string; note: string }[];
  collectionQueue: CollectionQueue;

  // detail
  applicant: Applicant;
  terms: LoanTerms;
  documents: DocumentItem[];
  checklist: ChecklistItem[];
  credit: CreditInfo;
  financials: Financials;
  exceptions: ExceptionRecord[];
  notes: { id: string; timestamp: string; actor: string; text: string }[];
  history: HistoryEvent[];
}
