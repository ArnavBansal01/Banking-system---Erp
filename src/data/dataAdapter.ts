import type { RawLoanCase } from "./mockData";
import type {
  CollectionQueue,
  CreditInfo,
  Financials,
  HistoryEvent,
  LoanCase,
  Priority,
  Stage,
  WorkflowStatus,
} from "@/types/loan";

/**
 * Adapter: normalises whatever the mock/API source provides into the canonical
 * LoanCase model. Values that are missing from the source are DERIVED here,
 * never typed into components.
 */

const stageMap: Record<string, Stage> = {
  enquiry: "enquiry",
  credit_review: "credit_review",
  disbursement: "disbursement",
  collections: "collections",
  closed: "closed",
};

const statusMap: Record<string, WorkflowStatus> = {
  "New Enquiry": "New Enquiry",
  "Reached Out": "Contacted",
  Contacted: "Contacted",
  Interested: "Interested",
  New: "New",
  Review: "In Review",
  Query: "In Review",
  Ready: "Ready",
  Verification: "Verification",
  Disbursements: "Disbursements",
  Overdue: "OVERDUE",
  "Follow Ups Pending": "DUE",
  "Payments To Collect": "DUE",
  "Physical Visits": "DUE",
  "Collections Completed": "RESOLVED",
};

const queueMap: Record<string, CollectionQueue> = {
  "Follow Ups Pending": "followup",
  "Physical Visits": "visit",
  "Payments To Collect": "payment",
  Overdue: "payment",
  "Collections Completed": "none",
};

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return h;
}

function derivePriority(raw: RawLoanCase): Priority {
  if (raw.subStatus === "Overdue") return "Critical";
  if (raw.loanAmount >= 8000000) return "High";
  if (raw.temperature === "Hot") return "High";
  if (raw.temperature === "Warm") return "Medium";
  return "Low";
}

function deriveCredit(raw: RawLoanCase): CreditInfo {
  const h = hash(raw.id);
  const cibil = 640 + (h % 160);
  const bounced = raw.emiHistory.filter((e) => e.bounced).length;
  const existingObligations = Math.round(raw.emiAmount * (0.3 + (h % 40) / 100));
  const riskLevel = cibil < 680 || bounced > 0 ? (cibil < 660 ? "High" : "Moderate") : "Low";
  return {
    cibil,
    existingLoans: h % 4,
    existingObligations,
    defaults: bounced,
    overdueAmount: bounced * raw.emiAmount,
    riskLevel,
    recommendation:
      riskLevel === "Low"
        ? "Proceed at approved pricing"
        : riskLevel === "Moderate"
          ? "Proceed with pricing deviation review"
          : "Requires senior credit authority",
  };
}

function deriveFinancials(raw: RawLoanCase, credit: CreditInfo): Financials {
  const annualRevenue = raw.loanAmount * (2 + (hash(raw.id) % 20) / 10);
  const netCashFlow = Math.round((annualRevenue / 12) * 0.22);
  return {
    annualRevenue: Math.round(annualRevenue),
    netCashFlow,
    existingObligations: credit.existingObligations,
    repaymentCapacity: Math.round(
      ((netCashFlow - credit.existingObligations) / raw.emiAmount) * 100,
    ),
  };
}

function isoShift(base: string, days: number): string {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const APPLICATION_ANCHOR = "2026-09-02";

export function adaptCase(raw: RawLoanCase, index: number): LoanCase {
  const stage = stageMap[raw.stage] ?? "enquiry";
  const credit = deriveCredit(raw);
  const financials = deriveFinancials(raw, credit);
  const h = hash(raw.id);
  const inPipeline = stage === "credit_review" || stage === "disbursement";
  const isCase004 = raw.id === "CASE-004";
  const isCase007 = raw.id === "CASE-007";
  const applicationDate = isCase004
    ? isoShift(APPLICATION_ANCHOR, -16) // Converted 16 days ago -> Day 17 (>15d SLA breach)
    : raw.id === "CASE-005"
      ? isoShift(APPLICATION_ANCHOR, -7)
      : raw.id === "CASE-006"
        ? isoShift(APPLICATION_ANCHOR, -3)
        : inPipeline
          ? isoShift(APPLICATION_ANCHOR, -(2 + (h % 12)))
          : null;
  const disbursed = raw.stage === "collections" || raw.subStatus === "Disbursements";

  const approvalDate = isCase007
    ? isoShift(APPLICATION_ANCHOR, -18)
    : raw.stage === "disbursement"
      ? isoShift(APPLICATION_ANCHOR, -5)
      : disbursed
        ? isoShift(APPLICATION_ANCHOR, -20)
        : null;

  const workflowStatus =
    isCase004 || isCase007
      ? "SLA Attention"
      : (statusMap[raw.subStatus] ?? (stage === "credit_review" ? "New" : "New Enquiry"));

  const history: HistoryEvent[] = [
    {
      id: `${raw.id}-h0`,
      timestamp: `${isoShift(APPLICATION_ANCHOR, -(6 + (h % 14)))}T09:42`,
      actor: raw.assignedOfficer,
      action: "Enquiry created",
    },
  ];
  if (applicationDate) {
    history.push({
      id: `${raw.id}-h1`,
      timestamp: `${applicationDate}T10:18`,
      actor: raw.assignedOfficer,
      action: "Application submitted to credit",
      note: isCase004 ? "Enquiry converted to application, Day 1 begins" : undefined,
    });
  }
  if (isCase004) {
    history.push({
      id: `${raw.id}-h2`,
      timestamp: `${isoShift(APPLICATION_ANCHOR, -1)}T09:15`,
      actor: "Credit Risk SLA Monitor",
      action: "Application SLA breached (>15 days)",
      note: "Pending credit assessment exceeded 15-day application window. Escalated to Regional Manager & MD for sanction review.",
    });
  }
  if (approvalDate && !disbursed) {
    history.push({
      id: `${raw.id}-h2`,
      timestamp: `${approvalDate}T14:20`,
      actor: "Branch Credit Manager",
      action: "Approved by credit authority",
      note: isCase007
        ? "Sanctioned 18 days ago; pending document verification breached 15-day SLA"
        : "Sanctioned, forwarded to Operations for verification",
    });
  }
  if (disbursed) {
    history.push({
      id: `${raw.id}-h2`,
      timestamp: `${isoShift(APPLICATION_ANCHOR, -20)}T14:20`,
      actor: "Branch Credit Manager",
      action: "Approved by credit authority",
    });
    history.push({
      id: `${raw.id}-h3`,
      timestamp: `${isoShift(APPLICATION_ANCHOR, -18)}T11:05`,
      actor: "Operations",
      action: "Disbursement processed",
      note: "Funds released to borrower account",
    });
  }

  const paidHistory = raw.emiHistory.filter((e) => e.paidDate);

  return {
    id: raw.id,
    clientName: raw.clientName,
    loanAmount: raw.loanAmount,
    emiAmount: raw.emiAmount,
    outstanding: Math.round(raw.loanAmount - paidHistory.length * raw.emiAmount),

    stage: raw.stage === "collections" ? "collections" : stage,
    workflowStatus,

    queryRaised: raw.subStatus === "Query",
    escalated: false,
    cibilException: credit.cibil < 680,
    priority: derivePriority(raw),

    region: raw.region,
    area: raw.area,
    branch: raw.branch,
    assignedOfficer: raw.assignedOfficer,

    temperature: raw.temperature,
    followUpCount: raw.followUpCount,
    nextFollowUp: stage === "enquiry" ? isoShift(APPLICATION_ANCHOR, 1 + (index % 5)) : null,
    lastFollowUp: raw.followUpCount > 0 ? isoShift(APPLICATION_ANCHOR, -(1 + (h % 6))) : null,

    applicationDate,
    approvalDate,
    reopenedAt: null,
    reopenedBy: null,
    disbursedDate: disbursed ? isoShift(APPLICATION_ANCHOR, -18) : null,
    disbursedAmount: disbursed ? raw.loanAmount : 0,

    dueDayStart: raw.dueDayStart,
    dueDayEnd: raw.dueDayEnd,
    emiHistory: raw.emiHistory,
    payments: paidHistory.map((e, i) => ({
      id: `${raw.id}-p${i}`,
      amount: raw.emiAmount,
      date: e.paidDate as string,
      mode: e.bounced ? "NACH (retried)" : "NACH",
    })),
    visits: [],
    collectionQueue: raw.stage === "collections" ? (queueMap[raw.subStatus] ?? "followup") : "none",

    applicant: {
      entityType: raw.clientName.match(/Pvt|Corp|Solutions|Platforms|Services/)
        ? "Private Limited"
        : "Proprietorship",
      contact: `+91 ${90000 + (h % 9999)} ${10000 + (h % 89999)}`,
      email: `accounts@${(raw.clientName.split(" ")[0] ?? "client").toLowerCase()}.in`,
      business: `${raw.branch} · ${raw.area}`,
      purpose: raw.loanAmount > 5000000 ? "Capital expansion" : "Working capital",
    },
    terms: {
      product: raw.loanAmount > 5000000 ? "Secured Business Loan" : "Business Loan",
      tenureMonths: Math.max(12, Math.round(raw.loanAmount / raw.emiAmount)),
      interestRate: 13 + (h % 45) / 10,
      repayment: "Monthly EMI · NACH mandate",
      bankAccount: `XXXX XXXX ${1000 + (h % 8999)}`,
    },
    documents: [
      { name: "KYC — Identity & Address", received: true },
      { name: "Income / Business Proof", received: h % 5 !== 0 },
      { name: "Bank Statements (12 months)", received: h % 3 !== 0 },
      { name: "GST Returns", received: h % 4 !== 0 },
      { name: "Collateral / Security Papers", received: raw.loanAmount <= 5000000 },
    ],
    checklist: [
      { key: "applicant", label: "Applicant details verified", done: disbursed },
      { key: "bank", label: "Bank details verified", done: disbursed },
      { key: "contact", label: "Contact details verified", done: disbursed },
      { key: "terms", label: "Loan terms confirmed", done: disbursed },
      { key: "docs", label: "Required documents complete", done: disbursed },
    ],
    credit,
    financials,
    exceptions:
      credit.cibil < 680
        ? [
            {
              id: `${raw.id}-e0`,
              type: "CIBIL exception",
              authority: "Area Credit",
              decision: "Pending",
              reason: `Bureau score ${credit.cibil} below policy floor`,
              timestamp: `${isoShift(APPLICATION_ANCHOR, -4)}T12:15`,
            },
          ]
        : [],
    notes: [],
    queries:
      raw.subStatus === "Query"
        ? [
            {
              id: `${raw.id}-q1`,
              question:
                "Borrower declared monthly turnover of ₹15L, but Q1 bank credits average ₹8.5L. Please clarify difference with audited ledger or revised statement.",
              raisedBy: "Arnav",
              raisedByRole: "Officer",
              raisedAt: `${isoShift(APPLICATION_ANCHOR, -2)}T11:30`,
              targetRoles: ["Branch Manager"],
              status: "OPEN",
            },
          ]
        : raw.id === "CASE-004"
          ? [
              {
                id: `${raw.id}-q0`,
                question:
                  "Warehouse rental agreement page 3 signature is blurred. Please submit clean scanned copy.",
                raisedBy: "Operations Desk",
                raisedByRole: "Branch Manager",
                raisedAt: `${isoShift(APPLICATION_ANCHOR, -8)}T10:15`,
                targetRoles: ["Officer"],
                status: "RESOLVED",
                resolution:
                  "Fresh high-resolution scanned agreement uploaded and verified against land registry stamp.",
                resolvedBy: "Arnav",
                resolvedByRole: "Officer",
                resolvedAt: `${isoShift(APPLICATION_ANCHOR, -7)}T15:45`,
              },
            ]
          : [],
    history,
  };
}

export function adaptCases(rows: RawLoanCase[]): LoanCase[] {
  return rows.map(adaptCase);
}
