import type { LoanRow } from "./db";

/**
 * Cassmart Micro Foundations - Case Server Functions
 * Plain async functions that Route Handlers can call.
 * All DuckDB queries, validation, error handling, and return structures
 * are preserved exactly from the original TanStack Start implementation.
 */

let queriesColumnsVerified = false;

async function getDb() {
  const { db, initDb } = await import("./db");
  await initDb();
  if (!queriesColumnsVerified) {
    const cols = [
      "ALTER TABLE queries ADD COLUMN IF NOT EXISTS loan_id VARCHAR",
      "ALTER TABLE queries ADD COLUMN IF NOT EXISTS question VARCHAR",
      "ALTER TABLE queries ADD COLUMN IF NOT EXISTS raised_by VARCHAR",
      "ALTER TABLE queries ADD COLUMN IF NOT EXISTS raised_by_role VARCHAR",
      "ALTER TABLE queries ADD COLUMN IF NOT EXISTS target_roles VARCHAR",
      "ALTER TABLE queries ADD COLUMN IF NOT EXISTS resolution VARCHAR",
      "ALTER TABLE queries ADD COLUMN IF NOT EXISTS resolved_by VARCHAR",
      "ALTER TABLE queries ADD COLUMN IF NOT EXISTS resolved_by_role VARCHAR",
      "ALTER TABLE queries ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP",
      "ALTER TABLE installments ADD COLUMN IF NOT EXISTS amount DOUBLE",
    ];
    for (const sql of cols) {
      try {
        await db.run(sql);
      } catch (_colErr) {
        // Ignore if already exists
      }
    }
    queriesColumnsVerified = true;
  }
  return db;
}

const VALID_STAGES = [
  "enquiry",
  "application",
  "credit approved",
  "disbursed",
  "active loan",
  "recovered",
] as const;

export type ValidStage = (typeof VALID_STAGES)[number];

const VALID_LOAN_TYPES = [
  "Business",
  "Agriculture",
  "Dairy",
  "Education",
  "Home improvement",
  "Medical/Emergency",
  "Vehicle",
  "Household",
  "Wedding/Social expense",
] as const;

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface CreateNewEnquiryInput {
  name: string;
  phone?: string | undefined;
  email?: string | undefined;
  amount: number;
  emi_amount?: number | undefined;
  purpose?: string | undefined;
  loan_type?: string | undefined;
  tenure_in_months?: number | undefined;
  rate_of_interest?: number | undefined;
  loan_group_id?: string | undefined;
}

export interface GetLoansByStageInput {
  stage: string;
}

export interface UpdateLoanStageInput {
  loan_id: string;
  new_stage: string;
}

export interface UpdateLoanStageResult {
  success: boolean;
  loan_id: string;
  new_stage: string;
  updated_at: string;
}

export interface AddLoanNoteInput {
  loan_id: string;
  content: string;
  added_by_emp_id?: string | undefined;
}

export interface LoanNoteRecord {
  id: string;
  loan_id: string;
  added_by_emp_id?: string | null;
  content: string;
  created_at: string;
}

export interface ResolveCaseInput {
  loan_id: string;
  note?: string | undefined;
  resolved_by?: string | undefined;
}

export interface ResolveCaseResult {
  success: boolean;
  loan_id: string;
  stage: string;
  updated_at: string;
}

export interface InstallmentDbRecord {
  id: string;
  loan_id: string;
  due_date: string | null;
  state: string;
  payment_date: string | null;
  transaction_id: string | null;
  paid_at: string | null;
  payment_method: string | null;
  amount: number | null;
}

export interface RecordLoanPaymentInput {
  loan_id: string;
  amount: number;
  payment_method?: string | undefined;
  paid_date?: string | undefined;
  recorded_by?: string | undefined;
}

export interface RecordLoanPaymentResult {
  success: boolean;
  installment_id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  remaining_outstanding: number;
  stage: string;
}

export interface GetLoanDetailsInput {
  loan_id: string;
}

export interface LoanDetailRecord extends LoanRow {
  borrower_name: string | null;
  borrower_phone: string | null;
  borrower_email: string | null;
  borrower_aadhar_no: string | null;
  borrower_pan_no: string | null;
  queries?: CaseQueryDbRecord[];
  installments?: InstallmentDbRecord[];
}

export interface CreateCaseQueryInput {
  loan_id: string;
  question: string;
  raised_by: string;
  raised_by_role?: string | undefined;
  target_roles?: string | undefined;
}

export interface CaseQueryDbRecord {
  id: string;
  loan_id: string;
  question: string;
  status: string;
  query_type: string;
  raised_by: string;
  raised_by_role: string;
  target_roles: string;
  resolution?: string | null | undefined;
  resolved_by?: string | null | undefined;
  resolved_by_role?: string | null | undefined;
  resolved_at?: string | null | undefined;
  created_at: string;
}

export interface ResolveCaseQueryInput {
  query_id: string;
  resolution: string;
  resolved_by: string;
  resolved_by_role?: string | undefined;
}

export interface ResolveCaseQueryResult {
  success: boolean;
  query_id: string;
  resolution: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// 1. createNewEnquiry
// INSERT into users and loans using parameterized queries.
// ---------------------------------------------------------------------------

export async function createNewEnquiry(
  rawInput: CreateNewEnquiryInput,
): Promise<LoanDetailRecord> {
  // Validation (preserved exactly from original)
  if (!rawInput || typeof rawInput !== "object") {
    throw new Error("Invalid payload: object required");
  }
  if (!rawInput.name || typeof rawInput.name !== "string" || !rawInput.name.trim()) {
    throw new Error("Invalid name: borrower name is required");
  }
  const amount = Number(rawInput.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid loan amount: must be greater than zero");
  }
  const data: Required<CreateNewEnquiryInput> = {
    name: rawInput.name.trim(),
    phone: rawInput.phone ? rawInput.phone.trim() : "",
    email: rawInput.email ? rawInput.email.trim() : "",
    amount,
    emi_amount: rawInput.emi_amount ? Number(rawInput.emi_amount) : Math.round(amount / 24),
    purpose: rawInput.purpose?.trim() || "Working capital",
    loan_type:
      rawInput.loan_type &&
      VALID_LOAN_TYPES.includes(rawInput.loan_type as (typeof VALID_LOAN_TYPES)[number])
        ? rawInput.loan_type
        : "Business",
    tenure_in_months: rawInput.tenure_in_months ? Number(rawInput.tenure_in_months) : 24,
    rate_of_interest: rawInput.rate_of_interest ? Number(rawInput.rate_of_interest) : 15.5,
    loan_group_id: rawInput.loan_group_id?.trim() || "",
  };

  const db = await getDb();
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  const userId = `USR-${timestamp}-${randomSuffix}`;
  const loanId = `LOAN-${timestamp}-${randomSuffix}`;

  try {
    // 1. Insert borrower into users table
    await db.run(
      `INSERT INTO users (id, name, phone, email, loan_group_id) VALUES (?, ?, ?, ?, ?)`,
      userId,
      data.name,
      data.phone || null,
      data.email || null,
      data.loan_group_id || null,
    );

    // 2. Insert loan into loans table
    await db.run(
      `
      INSERT INTO loans (
        id,
        user_id,
        stage,
        purpose,
        loan_type,
        amount,
        rate_of_interest,
        tenure_in_months,
        emi_amount,
        loan_group_id
      ) VALUES (?, ?, 'enquiry', ?, ?, ?, ?, ?, ?, ?)
      `,
      loanId,
      userId,
      data.purpose,
      data.loan_type,
      data.amount,
      data.rate_of_interest,
      data.tenure_in_months,
      data.emi_amount,
      data.loan_group_id || null,
    );

    try {
      await db.run("CHECKPOINT;");
    } catch (cpErr) {
      console.warn("[Cassmart DB] Checkpoint notice:", cpErr);
    }

    // 3. Return full joined record
    const rows = await db.all(
      `
      SELECT
        loans.*,
        users.name AS borrower_name,
        users.phone AS borrower_phone,
        users.email AS borrower_email,
        users.aadhar_no AS borrower_aadhar_no,
        users.pan_no AS borrower_pan_no
      FROM loans
      LEFT JOIN users ON loans.user_id = users.id
      WHERE loans.id = ?
      LIMIT 1
      `,
      loanId,
    );

    return rows[0] as LoanDetailRecord;
  } catch (error) {
    console.error("[Cassmart DB] Failed to create new enquiry:", error);
    throw new Error(`Failed to create enquiry: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 2. updateLoanStage
// UPDATE stage of loan using parameterized query.
// ---------------------------------------------------------------------------

export async function updateLoanStage(
  input: UpdateLoanStageInput,
): Promise<UpdateLoanStageResult> {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: loan_id and new_stage are required");
  }
  if (!input.loan_id || typeof input.loan_id !== "string") {
    throw new Error("Invalid loan_id: must be a non-empty string");
  }
  const cleanStage = input.new_stage?.trim() as ValidStage;
  if (!cleanStage || !VALID_STAGES.includes(cleanStage)) {
    throw new Error(`Invalid new_stage: must be one of ${VALID_STAGES.join(", ")}`);
  }
  const loan_id = input.loan_id.trim();
  const new_stage = cleanStage;

  try {
    const db = await getDb();
    await db.run("UPDATE loans SET stage = ? WHERE id = ?", new_stage, loan_id);
    try { await db.run("CHECKPOINT;"); } catch {}
    return {
      success: true,
      loan_id,
      new_stage,
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      `[Cassmart DB] Failed to update stage for loan '${loan_id}' to '${new_stage}':`,
      error,
    );
    throw new Error(`Failed to update loan stage: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 3. addLoanNote
// INSERT into loan_notes table using parameterized query.
// ---------------------------------------------------------------------------

export async function addLoanNote(input: AddLoanNoteInput): Promise<LoanNoteRecord> {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: loan_id and content are required");
  }
  if (!input.loan_id || typeof input.loan_id !== "string" || !input.loan_id.trim()) {
    throw new Error("Invalid loan_id: non-empty string required");
  }
  if (!input.content || typeof input.content !== "string" || !input.content.trim()) {
    throw new Error("Invalid content: note text is required");
  }
  const data = {
    loan_id: input.loan_id.trim(),
    content: input.content.trim(),
    added_by_emp_id: input.added_by_emp_id?.trim() || "Officer",
  };

  try {
    const db = await getDb();
    const noteId = `NOTE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await db.run(
      `INSERT INTO loan_notes (id, loan_id, added_by_emp_id, content) VALUES (?, ?, ?, ?)`,
      noteId,
      data.loan_id,
      data.added_by_emp_id || null,
      data.content,
    );
    try { await db.run("CHECKPOINT;"); } catch {}

    const rows = await db.all("SELECT * FROM loan_notes WHERE id = ? LIMIT 1", noteId);
    return rows[0] as LoanNoteRecord;
  } catch (error) {
    console.error(`[Cassmart DB] Failed to add loan note for '${input.loan_id}':`, error);
    throw new Error(`Failed to add loan note: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 4. resolveCase
// UPDATE loans SET stage = 'recovered' and optionally INSERT into loan_notes.
// ---------------------------------------------------------------------------

export async function resolveCase(input: ResolveCaseInput): Promise<ResolveCaseResult> {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: loan_id is required");
  }
  if (!input.loan_id || typeof input.loan_id !== "string" || !input.loan_id.trim()) {
    throw new Error("Invalid loan_id: non-empty string required");
  }
  const data = {
    loan_id: input.loan_id.trim(),
    note: input.note?.trim() || undefined,
    resolved_by: input.resolved_by?.trim() || "Officer",
  };

  try {
    const db = await getDb();
    await db.run("UPDATE loans SET stage = 'recovered' WHERE id = ?", data.loan_id);

    if (data.note) {
      const noteId = `NOTE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.run(
        `INSERT INTO loan_notes (id, loan_id, added_by_emp_id, content) VALUES (?, ?, ?, ?)`,
        noteId,
        data.loan_id,
        data.resolved_by || null,
        `Case Resolved: ${data.note}`,
      );
    }
    try { await db.run("CHECKPOINT;"); } catch {}

    return {
      success: true,
      loan_id: data.loan_id,
      stage: "recovered",
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[Cassmart DB] Failed to resolve case '${input.loan_id}':`, error);
    throw new Error(`Failed to resolve case: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 5. getAllLoans
// Returns all loans joined with borrower user info in a single fast query.
// ---------------------------------------------------------------------------

export async function getAllLoans(): Promise<LoanDetailRecord[]> {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT
        loans.*,
        users.name AS borrower_name,
        users.phone AS borrower_phone,
        users.email AS borrower_email,
        users.aadhar_no AS borrower_aadhar_no,
        users.pan_no AS borrower_pan_no
      FROM loans
      LEFT JOIN users ON loans.user_id = users.id
      ORDER BY loans.id DESC
    `);

    let queriesRows: CaseQueryDbRecord[] = [];
    try {
      queriesRows = ((await db.all("SELECT * FROM queries ORDER BY created_at ASC")) ??
        []) as CaseQueryDbRecord[];
    } catch (queryErr) {
      console.warn("[Cassmart DB] Non-fatal: failed to fetch queries table:", queryErr);
      queriesRows = [];
    }

    let installmentsRows: InstallmentDbRecord[] = [];
    try {
      installmentsRows = ((await db.all("SELECT * FROM installments ORDER BY payment_date ASC, paid_at ASC")) ??
        []) as InstallmentDbRecord[];
    } catch (instErr) {
      console.warn("[Cassmart DB] Non-fatal: failed to fetch installments table:", instErr);
      installmentsRows = [];
    }

    return (rows ?? []).map((loan) => ({
      ...(loan as LoanDetailRecord),
      queries: queriesRows.filter((q) => q.loan_id === (loan as LoanDetailRecord).id),
      installments: installmentsRows.filter((i) => i.loan_id === (loan as LoanDetailRecord).id),
    }));
  } catch (error) {
    console.error("[Cassmart DB] Failed to fetch all loans:", error);
    throw new Error(`Failed to retrieve loans: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 6. getLoansByStage
// Returns all loans matching a given stage using a parameterized query.
// ---------------------------------------------------------------------------

export async function getLoansByStage(stage: string): Promise<LoanDetailRecord[]> {
  if (!stage || typeof stage !== "string") {
    throw new Error("Invalid stage input: stage string is required");
  }
  const cleanStage = stage.trim();

  try {
    const db = await getDb();
    const rows = await db.all(
      `
      SELECT
        loans.*,
        users.name AS borrower_name,
        users.phone AS borrower_phone,
        users.email AS borrower_email,
        users.aadhar_no AS borrower_aadhar_no,
        users.pan_no AS borrower_pan_no
      FROM loans
      LEFT JOIN users ON loans.user_id = users.id
      WHERE loans.stage = ?
      ORDER BY loans.id DESC
      `,
      cleanStage,
    );
    return (rows ?? []) as LoanDetailRecord[];
  } catch (error) {
    console.error(`[Cassmart DB] Failed to fetch loans for stage '${cleanStage}':`, error);
    throw new Error(`Failed to retrieve loans for stage '${cleanStage}': ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 7. getLoanDetails
// Fetches single loan record with LEFT JOIN on users for borrower contact info.
// ---------------------------------------------------------------------------

export async function getLoanDetails(loan_id: string): Promise<LoanDetailRecord | null> {
  if (!loan_id || typeof loan_id !== "string") {
    throw new Error("Invalid loan_id: non-empty string is required");
  }
  const cleanId = loan_id.trim();

  try {
    const db = await getDb();
    const rows = await db.all(
      `
      SELECT
        loans.*,
        users.name AS borrower_name,
        users.phone AS borrower_phone,
        users.email AS borrower_email,
        users.aadhar_no AS borrower_aadhar_no,
        users.pan_no AS borrower_pan_no
      FROM loans
      LEFT JOIN users ON loans.user_id = users.id
      WHERE loans.id = ?
      LIMIT 1
      `,
      cleanId,
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    let loanInstallments: InstallmentDbRecord[] = [];
    try {
      loanInstallments = ((await db.all("SELECT * FROM installments WHERE loan_id = ? ORDER BY payment_date ASC, paid_at ASC", cleanId)) ??
        []) as InstallmentDbRecord[];
    } catch (instErr) {
      console.warn("[Cassmart DB] Non-fatal: failed to fetch installments for loan:", instErr);
      loanInstallments = [];
    }

    return {
      ...(rows[0] as LoanDetailRecord),
      installments: loanInstallments,
    };
  } catch (error) {
    console.error(`[Cassmart DB] Failed to fetch loan details for '${cleanId}':`, error);
    throw new Error(`Failed to retrieve loan details: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 8. getLoanNotes
// Fetches all notes for a specific loan record.
// ---------------------------------------------------------------------------

export async function getLoanNotes(loan_id: string): Promise<LoanNoteRecord[]> {
  if (!loan_id || typeof loan_id !== "string") {
    throw new Error("Invalid loan_id: non-empty string is required");
  }
  const cleanId = loan_id.trim();

  try {
    const db = await getDb();
    const rows = await db.all(
      "SELECT * FROM loan_notes WHERE loan_id = ? ORDER BY created_at ASC",
      cleanId,
    );
    return (rows ?? []) as LoanNoteRecord[];
  } catch (error) {
    console.error(`[Cassmart DB] Failed to fetch notes for '${cleanId}':`, error);
    throw new Error(`Failed to retrieve loan notes: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 9. createCaseQuery
// INSERT into queries and query_contexts tables in DuckDB.
// ---------------------------------------------------------------------------

export async function createCaseQuery(input: CreateCaseQueryInput): Promise<CaseQueryDbRecord> {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: loan_id and question are required");
  }
  if (!input.loan_id || !input.loan_id.trim()) {
    throw new Error("Invalid loan_id: required");
  }
  if (!input.question || !input.question.trim()) {
    throw new Error("Invalid question: question text is required");
  }
  const data = {
    loan_id: input.loan_id.trim(),
    question: input.question.trim(),
    raised_by: input.raised_by?.trim() || "Officer",
    raised_by_role: input.raised_by_role?.trim() || "Officer",
    target_roles: input.target_roles?.trim() || "Branch Manager",
  };

  const db = await getDb();
  const queryId = `QRY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await db.run(
      `
      INSERT INTO queries (
        id, loan_id, question, status, query_type, raised_by, raised_by_role, target_roles
      ) VALUES (?, ?, ?, 'pending', 'Other', ?, ?, ?)
      `,
      queryId,
      data.loan_id,
      data.question,
      data.raised_by,
      data.raised_by_role,
      data.target_roles,
    );

    const ctxId = `CTX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await db.run(
        `INSERT INTO query_contexts (id, query_id, context_text, message_direction) VALUES (?, ?, ?, 'sent')`,
        ctxId,
        queryId,
        data.question,
      );
    } catch (contextErr) {
      console.warn(
        "[Cassmart DB] Non-fatal: failed to insert initial query context:",
        contextErr,
      );
    }

    const rows = await db.all("SELECT * FROM queries WHERE id = ? LIMIT 1", queryId);
    try { await db.run("CHECKPOINT;"); } catch {}
    return rows[0] as CaseQueryDbRecord;
  } catch (error) {
    console.error("[Cassmart DB] Failed to create query:", error);
    throw new Error(`Failed to create query: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 10. resolveCaseQuery
// UPDATE queries SET status = 'resolved' and append response to query_contexts.
// ---------------------------------------------------------------------------

export async function resolveCaseQuery(
  input: ResolveCaseQueryInput,
): Promise<ResolveCaseQueryResult> {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload: query_id and resolution are required");
  }
  if (!input.query_id || !input.query_id.trim()) {
    throw new Error("Invalid query_id: required");
  }
  if (!input.resolution || !input.resolution.trim()) {
    throw new Error("Invalid resolution: resolution text is required");
  }
  const data = {
    query_id: input.query_id.trim(),
    resolution: input.resolution.trim(),
    resolved_by: input.resolved_by?.trim() || "Officer",
    resolved_by_role: input.resolved_by_role?.trim() || "Officer",
  };

  const db = await getDb();
  try {
    await db.run(
      `
      UPDATE queries
      SET status = 'resolved',
          resolution = ?,
          resolved_by = ?,
          resolved_by_role = ?,
          resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      data.resolution,
      data.resolved_by,
      data.resolved_by_role,
      data.query_id,
    );

    const ctxId = `CTX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await db.run(
        `INSERT INTO query_contexts (id, query_id, context_text, message_direction) VALUES (?, ?, ?, 'received')`,
        ctxId,
        data.query_id,
        data.resolution,
      );
    } catch (contextErr) {
      console.warn("[Cassmart DB] Non-fatal: failed to insert resolution context:", contextErr);
    }

    try { await db.run("CHECKPOINT;"); } catch {}

    return {
      success: true,
      query_id: data.query_id,
      resolution: data.resolution,
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Cassmart DB] Failed to resolve query:", error);
    throw new Error(`Failed to resolve query: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 11. recordLoanPayment
// Records payment into installments table, updates outstanding balance, and updates loan stage.
// ---------------------------------------------------------------------------

export async function recordLoanPayment(
  rawInput: RecordLoanPaymentInput,
): Promise<RecordLoanPaymentResult> {
  if (!rawInput || typeof rawInput !== "object") {
    throw new Error("Invalid payload: loan_id and amount are required");
  }
  if (!rawInput.loan_id || typeof rawInput.loan_id !== "string" || !rawInput.loan_id.trim()) {
    throw new Error("Invalid loan_id: non-empty string required");
  }
  const amount = Number(rawInput.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount: positive payment amount required");
  }
  const data = {
    loan_id: rawInput.loan_id.trim(),
    amount,
    payment_method: rawInput.payment_method?.trim() || "NACH",
    paid_date: rawInput.paid_date?.trim() || new Date().toISOString().slice(0, 10),
    recorded_by: rawInput.recorded_by?.trim() || "Officer",
  };

  try {
    const db = await getDb();
    const instId = `INST-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txnId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidDate: string = data.paid_date || new Date().toISOString().slice(0, 10);
    const paymentMethod: string = data.payment_method || "NACH";

    // 1. Insert into installments table
    await db.run(
      `INSERT INTO installments (id, loan_id, due_date, state, payment_date, transaction_id, paid_at, payment_method, amount)
       VALUES (?, ?, ?, 'paid', ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
      instId,
      data.loan_id,
      paidDate,
      paidDate,
      txnId,
      paymentMethod,
      data.amount,
    );

    // 2. Fetch loan to calculate remaining balance
    const loanRows = await db.all("SELECT * FROM loans WHERE id = ?", data.loan_id);
    const loan = (loanRows && loanRows[0]) as LoanRow | undefined;
    const originalAmount = loan?.amount ?? 0;

    // 3. Compute total payments to date for this loan
    const paidRows = await db.all(
      "SELECT COALESCE(SUM(amount), 0) as total_paid FROM installments WHERE loan_id = ? AND state = 'paid'",
      data.loan_id,
    );
    const firstPaidRow = (paidRows && paidRows[0]) as Record<string, unknown> | undefined;
    const totalPaid = Number(firstPaidRow?.["total_paid"] ?? 0);
    const remaining = Math.max(0, originalAmount - totalPaid);

    // If fully repaid, mark recovered; otherwise ensure active loan
    let targetStage: string = loan?.stage || "active loan";
    if (remaining <= 0 && targetStage === "active loan") {
      targetStage = "recovered";
      await db.run("UPDATE loans SET stage = 'recovered' WHERE id = ?", data.loan_id);
    }

    // 4. Log to loan_notes
    const noteId = `NOTE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await db.run(
      `INSERT INTO loan_notes (id, loan_id, added_by_emp_id, content) VALUES (?, ?, ?, ?)`,
      noteId,
      data.loan_id,
      data.recorded_by || null,
      `Payment of ₹${data.amount.toLocaleString("en-IN")} received via ${paymentMethod} (Txn: ${txnId})`,
    );

    try { await db.run("CHECKPOINT;"); } catch {}

    return {
      success: true,
      installment_id: instId,
      loan_id: data.loan_id,
      amount: data.amount,
      payment_date: paidDate,
      remaining_outstanding: remaining,
      stage: targetStage,
    };
  } catch (error) {
    console.error(`[Cassmart DB] Failed to record payment for loan '${rawInput.loan_id}':`, error);
    throw new Error(`Failed to record payment: ${(error as Error).message}`);
  }
}
