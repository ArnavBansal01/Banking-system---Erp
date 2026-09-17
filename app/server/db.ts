import { Database } from "duckdb-async";

/**
 * Cassmart Micro Foundations
 * Persistent physical DuckDB database module
 */

declare global {
  var __cassmart_duckdb__: Database | undefined;
  var __cassmart_db_init__: Promise<void> | undefined;
}

// Reuse singleton on globalThis to prevent multiple file lock conflicts across Vite HMR and SSR re-evaluations
export const db: Database =
  globalThis.__cassmart_duckdb__ ?? (await Database.create("nbfc-erp.duckdb"));

globalThis.__cassmart_duckdb__ = db;

/**
 * Executes CREATE TYPE and CREATE TABLE statements for the Cassmart relational schema.
 * All tables are initialized empty without seed or mock data.
 */
export async function initDb(): Promise<void> {
  if (globalThis.__cassmart_db_init__) {
    return globalThis.__cassmart_db_init__;
  }

  globalThis.__cassmart_db_init__ = (async () => {
    // 1. DuckDB ENUM Types
    await db.run(`
    CREATE TYPE IF NOT EXISTS employee_role AS ENUM (
      'CEO',
      'MD',
      'Business Head',
      'Circle Head',
      'Regional Manager',
      'Area Manager',
      'Branch Manager',
      'General Manager',
      'Officer'
    );

    CREATE TYPE IF NOT EXISTS employee_department AS ENUM (
      'Sales',
      'credit',
      'operations',
      'collections',
      'No-Department'
    );

    CREATE TYPE IF NOT EXISTS loan_stage AS ENUM (
      'enquiry',
      'application',
      'credit approved',
      'disbursed',
      'active loan',
      'recovered'
    );

    CREATE TYPE IF NOT EXISTS loan_type_enum AS ENUM (
      'Business',
      'Agriculture',
      'Dairy',
      'Education',
      'Home improvement',
      'Medical/Emergency',
      'Vehicle',
      'Household',
      'Wedding/Social expense'
    );

    CREATE TYPE IF NOT EXISTS installment_state AS ENUM (
      'upcoming',
      'due',
      'overdue',
      'paid'
    );

    CREATE TYPE IF NOT EXISTS query_status AS ENUM (
      'pending',
      'resolved'
    );

    CREATE TYPE IF NOT EXISTS query_type_enum AS ENUM (
      'Document',
      'CIBIL',
      'Verification',
      'Other'
    );

    CREATE TYPE IF NOT EXISTS message_direction_enum AS ENUM (
      'sent',
      'received'
    );

    CREATE TYPE IF NOT EXISTS exception_issue_type AS ENUM (
      'KYC/Document',
      'Credit/Risk',
      'Pricing/Terms',
      'Banking/Mandate',
      'Disbursement',
      'Collection',
      'Compliance',
      'Fraud/suspicion',
      'other'
    );
  `);

    // 2. Relational Tables
    await db.run(`
    -- 1. Users
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      phone VARCHAR,
      email VARCHAR,
      aadhar_no VARCHAR,
      pan_no VARCHAR,
      loan_group_id VARCHAR
    );

    -- 3. Branches
    CREATE TABLE IF NOT EXISTS branches (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      address VARCHAR,
      manager_id VARCHAR,
      pincode VARCHAR,
      contact_number VARCHAR,
      type VARCHAR,
      region_id VARCHAR,
      area_id VARCHAR
    );

    -- 2. Employees
    CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      role employee_role NOT NULL,
      email VARCHAR,
      phone VARCHAR,
      aadhar_no VARCHAR,
      pan_no VARCHAR,
      profile_pic_link VARCHAR,
      department employee_department NOT NULL,
      branch_id VARCHAR REFERENCES branches(id)
    );

    -- 4. Loans
    CREATE TABLE IF NOT EXISTS loans (
      id VARCHAR PRIMARY KEY,
      user_id VARCHAR REFERENCES users(id),
      stage loan_stage NOT NULL,
      purpose VARCHAR,
      loan_type loan_type_enum NOT NULL,
      amount DOUBLE,
      rate_of_interest DOUBLE,
      tenure_in_months INTEGER,
      emi_amount DOUBLE,
      date_of_disbursal VARCHAR,
      loan_group_id VARCHAR,
      installments_group_id VARCHAR,
      queries_group_id VARCHAR,
      exceptions_group_id VARCHAR,
      loan_notes_group_id VARCHAR
    );

    -- 5. Installments
    CREATE TABLE IF NOT EXISTS installments (
      id VARCHAR PRIMARY KEY,
      loan_id VARCHAR REFERENCES loans(id),
      due_date VARCHAR,
      state installment_state NOT NULL,
      payment_date VARCHAR,
      transaction_id VARCHAR,
      paid_at VARCHAR,
      payment_method VARCHAR
    );

    -- 6. Queries
    CREATE TABLE IF NOT EXISTS queries (
      id VARCHAR PRIMARY KEY,
      status query_status NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      query_type query_type_enum NOT NULL,
      is_resolved_for_sender BOOLEAN DEFAULT FALSE,
      is_resolved_for_receiver BOOLEAN DEFAULT FALSE,
      sender_emp_id VARCHAR REFERENCES employees(id),
      receiver_emp_id VARCHAR REFERENCES employees(id)
    );

    -- 7. Query Contexts
    CREATE TABLE IF NOT EXISTS query_contexts (
      id VARCHAR PRIMARY KEY,
      query_id VARCHAR REFERENCES queries(id),
      context_text VARCHAR,
      attachment_link VARCHAR,
      message_direction message_direction_enum NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Exceptions
    CREATE TABLE IF NOT EXISTS exceptions (
      id VARCHAR PRIMARY KEY,
      loan_id VARCHAR REFERENCES loans(id),
      query_id VARCHAR REFERENCES queries(id),
      issue_type exception_issue_type NOT NULL,
      raised_by VARCHAR,
      assigned_to VARCHAR,
      description VARCHAR,
      status VARCHAR,
      priority VARCHAR,
      transaction_id VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP
    );

    -- 9. Loan Notes
    CREATE TABLE IF NOT EXISTS loan_notes (
      id VARCHAR PRIMARY KEY,
      loan_id VARCHAR REFERENCES loans(id),
      added_by_emp_id VARCHAR,
      content VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

    const queryColumns = [
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

    for (const sql of queryColumns) {
      try {
        await db.run(sql);
      } catch (colErr) {
        console.warn("[Cassmart DB] Column add notice:", colErr);
      }
    }

    console.info("[Cassmart DB] Schema initialized: nbfc-erp.duckdb is ready for real data.");
  })();

  return globalThis.__cassmart_db_init__;
}

// ---------------------------------------------------------------------------
// TypeScript Interfaces & Types
// ---------------------------------------------------------------------------

export type EmployeeRole =
  | "CEO"
  | "MD"
  | "Business Head"
  | "Circle Head"
  | "Regional Manager"
  | "Area Manager"
  | "Branch Manager"
  | "General Manager"
  | "Officer";

export type EmployeeDepartment =
  "Sales" | "credit" | "operations" | "collections" | "No-Department";

export type LoanStage =
  "enquiry" | "application" | "credit approved" | "disbursed" | "active loan" | "recovered";

export type LoanType =
  | "Business"
  | "Agriculture"
  | "Dairy"
  | "Education"
  | "Home improvement"
  | "Medical/Emergency"
  | "Vehicle"
  | "Household"
  | "Wedding/Social expense";

export type InstallmentState = "upcoming" | "due" | "overdue" | "paid";
export type QueryStatus = "pending" | "resolved";
export type QueryType = "Document" | "CIBIL" | "Verification" | "Other";
export type MessageDirection = "sent" | "received";
export type ExceptionIssueType =
  | "KYC/Document"
  | "Credit/Risk"
  | "Pricing/Terms"
  | "Banking/Mandate"
  | "Disbursement"
  | "Collection"
  | "Compliance"
  | "Fraud/suspicion"
  | "other";

export interface UserRow {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  aadhar_no?: string | null;
  pan_no?: string | null;
  loan_group_id?: string | null;
}

export interface EmployeeRow {
  id: string;
  name: string;
  role: EmployeeRole;
  email?: string | null;
  phone?: string | null;
  aadhar_no?: string | null;
  pan_no?: string | null;
  profile_pic_link?: string | null;
  department: EmployeeDepartment;
  branch_id?: string | null;
}

export interface BranchRow {
  id: string;
  name: string;
  address?: string | null;
  manager_id?: string | null;
  pincode?: string | null;
  contact_number?: string | null;
  type?: string | null;
  region_id?: string | null;
  area_id?: string | null;
}

export interface LoanRow {
  id: string;
  user_id?: string | null;
  stage: LoanStage;
  purpose?: string | null;
  loan_type: LoanType;
  amount?: number | null;
  rate_of_interest?: number | null;
  tenure_in_months?: number | null;
  emi_amount?: number | null;
  date_of_disbursal?: string | null;
  loan_group_id?: string | null;
  installments_group_id?: string | null;
  queries_group_id?: string | null;
  exceptions_group_id?: string | null;
  loan_notes_group_id?: string | null;
}

export interface InstallmentRow {
  id: string;
  loan_id?: string | null;
  due_date?: string | null;
  state: InstallmentState;
  payment_date?: string | null;
  transaction_id?: string | null;
  paid_at?: string | null;
  payment_method?: string | null;
}

export interface QueryRow {
  id: string;
  status: QueryStatus;
  created_at: string;
  query_type: QueryType;
  is_resolved_for_sender: boolean;
  is_resolved_for_receiver: boolean;
  sender_emp_id?: string | null;
  receiver_emp_id?: string | null;
}

export interface QueryContextRow {
  id: string;
  query_id?: string | null;
  context_text?: string | null;
  attachment_link?: string | null;
  message_direction: MessageDirection;
  created_at: string;
}

export interface ExceptionRow {
  id: string;
  loan_id?: string | null;
  query_id?: string | null;
  issue_type: ExceptionIssueType;
  raised_by?: string | null;
  assigned_to?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  transaction_id?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface LoanNoteRow {
  id: string;
  loan_id?: string | null;
  added_by_emp_id?: string | null;
  content?: string | null;
  created_at: string;
}
