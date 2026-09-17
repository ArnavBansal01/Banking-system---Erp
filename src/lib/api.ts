/**
 * Cassmart ERP — Client-side API layer
 * Communicates with Next.js Route Handlers via fetch.
 * NEVER imports DuckDB, app/server/db.ts, or any server-only module.
 */

import type {
  CreateNewEnquiryInput,
  UpdateLoanStageInput,
  UpdateLoanStageResult,
  AddLoanNoteInput,
  LoanNoteRecord,
  ResolveCaseInput,
  ResolveCaseResult,
  RecordLoanPaymentInput,
  RecordLoanPaymentResult,
  LoanDetailRecord,
  CreateCaseQueryInput,
  CaseQueryDbRecord,
  ResolveCaseQueryInput,
  ResolveCaseQueryResult,
} from "../../app/server/caseFunctions";

async function apiPost<TBody, TResult>(
  url: string,
  body: TBody,
): Promise<TResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(errJson.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<TResult>;
}

async function apiGet<TResult>(url: string): Promise<TResult> {
  const res = await fetch(url);
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(errJson.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<TResult>;
}

// ---------------------------------------------------------------------------
// API function wrappers — mirror the original createServerFn call signatures
// ---------------------------------------------------------------------------

export async function getAllLoans(): Promise<LoanDetailRecord[]> {
  return apiGet<LoanDetailRecord[]>("/api/cases/loans");
}

export async function getLoansByStage(stage: string): Promise<LoanDetailRecord[]> {
  return apiGet<LoanDetailRecord[]>(
    `/api/cases/loans/by-stage?stage=${encodeURIComponent(stage)}`,
  );
}

export async function getLoanDetails(loan_id: string): Promise<LoanDetailRecord | null> {
  const res = await fetch(`/api/cases/loans/details?loan_id=${encodeURIComponent(loan_id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(errJson.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<LoanDetailRecord>;
}

export async function createNewEnquiry(
  input: CreateNewEnquiryInput,
): Promise<LoanDetailRecord> {
  return apiPost<CreateNewEnquiryInput, LoanDetailRecord>(
    "/api/cases/loans/enquiry",
    input,
  );
}

export async function updateLoanStage(
  input: UpdateLoanStageInput,
): Promise<UpdateLoanStageResult> {
  return apiPost<UpdateLoanStageInput, UpdateLoanStageResult>(
    "/api/cases/loans/stage",
    input,
  );
}

export async function addLoanNote(input: AddLoanNoteInput): Promise<LoanNoteRecord> {
  return apiPost<AddLoanNoteInput, LoanNoteRecord>("/api/cases/loans/notes", input);
}

export async function getLoanNotes(loan_id: string): Promise<LoanNoteRecord[]> {
  return apiGet<LoanNoteRecord[]>(
    `/api/cases/loans/notes?loan_id=${encodeURIComponent(loan_id)}`,
  );
}

export async function resolveCase(input: ResolveCaseInput): Promise<ResolveCaseResult> {
  return apiPost<ResolveCaseInput, ResolveCaseResult>(
    "/api/cases/loans/resolve",
    input,
  );
}

export async function recordLoanPayment(
  input: RecordLoanPaymentInput,
): Promise<RecordLoanPaymentResult> {
  return apiPost<RecordLoanPaymentInput, RecordLoanPaymentResult>(
    "/api/cases/loans/payment",
    input,
  );
}

export async function createCaseQuery(
  input: CreateCaseQueryInput,
): Promise<CaseQueryDbRecord> {
  return apiPost<CreateCaseQueryInput, CaseQueryDbRecord>(
    "/api/cases/queries",
    input,
  );
}

export async function resolveCaseQuery(
  input: ResolveCaseQueryInput,
): Promise<ResolveCaseQueryResult> {
  return apiPost<ResolveCaseQueryInput, ResolveCaseQueryResult>(
    "/api/cases/queries/resolve",
    input,
  );
}
