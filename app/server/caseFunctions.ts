import { createServerFn } from "@tanstack/react-start";
import type { LoanRow } from "./db.ts";

/**
 * Cassmart Micro Foundations - Case Server Functions
 * Bridges the local DuckDB database to the frontend with typed TanStack Start server functions.
 * All mutations use parameterized SQL and execute directly against nbfc-erp.duckdb.
 */

let queriesColumnsVerified = false;

async function getDb() {
  const { db } = await import("./db.ts");
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
  added_by_emp_id: string | null;
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
}

// ---------------------------------------------------------------------------
// 1. createNewEnquiry (POST)
// INSERT into users and loans using parameterized queries.
// ---------------------------------------------------------------------------

export const createNewEnquiry = createServerFn({ method: "POST" })
  .validator((input: CreateNewEnquiryInput): CreateNewEnquiryInput => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid payload: object required");
    }
    if (!input.name || typeof input.name !== "string" || !input.name.trim()) {
      throw new Error("Invalid name: borrower name is required");
    }
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Invalid loan amount: must be greater than zero");
    }
    return {
      name: input.name.trim(),
      phone: input.phone ? input.phone.trim() : "",
      email: input.email ? input.email.trim() : "",
      amount,
      emi_amount: input.emi_amount ? Number(input.emi_amount) : Math.round(amount / 24),
      purpose: input.purpose?.trim() || "Working capital",
      loan_type:
        input.loan_type &&
        VALID_LOAN_TYPES.includes(input.loan_type as (typeof VALID_LOAN_TYPES)[number])
          ? input.loan_type
          : "Business",
      tenure_in_months: input.tenure_in_months ? Number(input.tenure_in_months) : 24,
      rate_of_interest: input.rate_of_interest ? Number(input.rate_of_interest) : 15.5,
      loan_group_id: input.loan_group_id?.trim() || undefined,
    };
  })
  .handler(async ({ data }): Promise<LoanDetailRecord> => {
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
  });

// ---------------------------------------------------------------------------
// 2. updateLoanStage (POST)
// UPDATE stage of loan using parameterized query.
// ---------------------------------------------------------------------------

export const updateLoanStage = createServerFn({ method: "POST" })
  .validator((input: UpdateLoanStageInput): UpdateLoanStageInput => {
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
    return {
      loan_id: input.loan_id.trim(),
      new_stage: cleanStage,
    };
  })
  .handler(async ({ data: { loan_id, new_stage } }): Promise<UpdateLoanStageResult> => {
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
  });

// ---------------------------------------------------------------------------
// 3. addLoanNote (POST)
// INSERT into loan_notes table using parameterized query.
// ---------------------------------------------------------------------------

export const addLoanNote = createServerFn({ method: "POST" })
  .validator((input: AddLoanNoteInput): AddLoanNoteInput => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid payload: loan_id and content are required");
    }
    if (!input.loan_id || typeof input.loan_id !== "string" || !input.loan_id.trim()) {
      throw new Error("Invalid loan_id: non-empty string required");
    }
    if (!input.content || typeof input.content !== "string" || !input.content.trim()) {
      throw new Error("Invalid content: note text is required");
    }
    return {
      loan_id: input.loan_id.trim(),
      content: input.content.trim(),
      added_by_emp_id: input.added_by_emp_id?.trim() || "Officer",
    };
  })
  .handler(async ({ data }): Promise<LoanNoteRecord> => {
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
      console.error(`[Cassmart DB] Failed to add loan note for '${data.loan_id}':`, error);
      throw new Error(`Failed to add loan note: ${(error as Error).message}`);
    }
  });

// ---------------------------------------------------------------------------
// 4. resolveCase (POST)
// UPDATE loans SET stage = 'recovered' and optionally INSERT into loan_notes.
// ---------------------------------------------------------------------------

export const resolveCase = createServerFn({ method: "POST" })
  .validator((input: ResolveCaseInput): ResolveCaseInput => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid payload: loan_id is required");
    }
    if (!input.loan_id || typeof input.loan_id !== "string" || !input.loan_id.trim()) {
      throw new Error("Invalid loan_id: non-empty string required");
    }
    return {
      loan_id: input.loan_id.trim(),
      note: input.note?.trim() || undefined,
      resolved_by: input.resolved_by?.trim() || "Officer",
    };
  })
  .handler(async ({ data }): Promise<ResolveCaseResult> => {
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
      console.error(`[Cassmart DB] Failed to resolve case '${data.loan_id}':`, error);
      throw new Error(`Failed to resolve case: ${(error as Error).message}`);
    }
  });

// ---------------------------------------------------------------------------
// 5. getAllLoans (GET)
// Returns all loans joined with borrower user info in a single fast query.
// ---------------------------------------------------------------------------

export const getAllLoans = createServerFn({ method: "GET" }).handler(
  async (): Promise<LoanDetailRecord[]> => {
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

      return (rows ?? []).map((loan) => ({
        ...(loan as LoanDetailRecord),
        queries: queriesRows.filter((q) => q.loan_id === (loan as LoanDetailRecord).id),
      }));
    } catch (error) {
      console.error("[Cassmart DB] Failed to fetch all loans:", error);
      throw new Error(`Failed to retrieve loans: ${(error as Error).message}`);
    }
  },
);

// ---------------------------------------------------------------------------
// 6. getLoansByStage (GET)
// Returns all loans matching a given stage using a parameterized query.
// ---------------------------------------------------------------------------

export const getLoansByStage = createServerFn({ method: "GET" })
  .validator((input: string | GetLoansByStageInput) => {
    const stage = typeof input === "object" && input !== null ? input.stage : input;
    if (!stage || typeof stage !== "string") {
      throw new Error("Invalid stage input: stage string is required");
    }
    return stage.trim();
  })
  .handler(async ({ data: stage }): Promise<LoanDetailRecord[]> => {
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
        stage,
      );
      return (rows ?? []) as LoanDetailRecord[];
    } catch (error) {
      console.error(`[Cassmart DB] Failed to fetch loans for stage '${stage}':`, error);
      throw new Error(`Failed to retrieve loans for stage '${stage}': ${(error as Error).message}`);
    }
  });

// ---------------------------------------------------------------------------
// 7. getLoanDetails (GET)
// Fetches single loan record with LEFT JOIN on users for borrower contact info.
// ---------------------------------------------------------------------------

export const getLoanDetails = createServerFn({ method: "GET" })
  .validator((input: string | GetLoanDetailsInput) => {
    const loan_id = typeof input === "object" && input !== null ? input.loan_id : input;
    if (!loan_id || typeof loan_id !== "string") {
      throw new Error("Invalid loan_id: non-empty string is required");
    }
    return loan_id.trim();
  })
  .handler(async ({ data: loan_id }): Promise<LoanDetailRecord | null> => {
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
        loan_id,
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      return rows[0] as LoanDetailRecord;
    } catch (error) {
      console.error(`[Cassmart DB] Failed to fetch loan details for '${loan_id}':`, error);
      throw new Error(`Failed to retrieve loan details: ${(error as Error).message}`);
    }
  });

// ---------------------------------------------------------------------------
// 8. getLoanNotes (GET)
// Fetches all notes for a specific loan record.
// ---------------------------------------------------------------------------

export const getLoanNotes = createServerFn({ method: "GET" })
  .validator((input: string | { loan_id: string }) => {
    const loan_id = typeof input === "object" && input !== null ? input.loan_id : input;
    if (!loan_id || typeof loan_id !== "string") {
      throw new Error("Invalid loan_id: non-empty string is required");
    }
    return loan_id.trim();
  })
  .handler(async ({ data: loan_id }): Promise<LoanNoteRecord[]> => {
    try {
      const db = await getDb();
      const rows = await db.all(
        "SELECT * FROM loan_notes WHERE loan_id = ? ORDER BY created_at ASC",
        loan_id,
      );
      return (rows ?? []) as LoanNoteRecord[];
    } catch (error) {
      console.error(`[Cassmart DB] Failed to fetch notes for '${loan_id}':`, error);
      throw new Error(`Failed to retrieve loan notes: ${(error as Error).message}`);
    }
  });

// ---------------------------------------------------------------------------
// 9. createCaseQuery (POST)
// INSERT into queries and query_contexts tables in DuckDB.
// ---------------------------------------------------------------------------

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

export const createCaseQuery = createServerFn({ method: "POST" })
  .validator((input: CreateCaseQueryInput): CreateCaseQueryInput => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid payload: loan_id and question are required");
    }
    if (!input.loan_id || !input.loan_id.trim()) {
      throw new Error("Invalid loan_id: required");
    }
    if (!input.question || !input.question.trim()) {
      throw new Error("Invalid question: question text is required");
    }
    return {
      loan_id: input.loan_id.trim(),
      question: input.question.trim(),
      raised_by: input.raised_by?.trim() || "Officer",
      raised_by_role: input.raised_by_role?.trim() || "Officer",
      target_roles: input.target_roles?.trim() || "Branch Manager",
    };
  })
  .handler(async ({ data }): Promise<CaseQueryDbRecord> => {
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
  });

// ---------------------------------------------------------------------------
// 10. resolveCaseQuery (POST)
// UPDATE queries SET status = 'resolved' and append response to query_contexts.
// ---------------------------------------------------------------------------

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

export const resolveCaseQuery = createServerFn({ method: "POST" })
  .validator((input: ResolveCaseQueryInput): ResolveCaseQueryInput => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid payload: query_id and resolution are required");
    }
    if (!input.query_id || !input.query_id.trim()) {
      throw new Error("Invalid query_id: required");
    }
    if (!input.resolution || !input.resolution.trim()) {
      throw new Error("Invalid resolution: resolution text is required");
    }
    return {
      query_id: input.query_id.trim(),
      resolution: input.resolution.trim(),
      resolved_by: input.resolved_by?.trim() || "Officer",
      resolved_by_role: input.resolved_by_role?.trim() || "Officer",
    };
  })
  .handler(async ({ data }): Promise<ResolveCaseQueryResult> => {
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
  });
