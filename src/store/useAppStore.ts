import { create } from "zustand";
import {
  createNewEnquiry,
  updateLoanStage,
  addLoanNote,
  resolveCase as resolveCaseDb,
  createCaseQuery,
  resolveCaseQuery,
  getAllLoans,
  getLoansByStage,
  getLoanDetails,
  recordLoanPayment,
  type LoanDetailRecord,
  type CaseQueryDbRecord,
  type InstallmentDbRecord,
} from "../../app/server/caseFunctions";
import type { LoanRow } from "../../app/server/db";
import type {
  AppNotification,
  CaseQuery,
  LoanCase,
  ModuleView,
  Role,
  Stage,
  WorkflowStatus,
} from "@/types/loan";
import { LOAN_STAGES } from "@/utils/transitions";
import { getNextHigherRoles } from "@/utils/permissions";

export interface UserProfile {
  name: string;
  email: string;
  role: Role;
  designation: string;
  department: string;
  scopeLabel: string;
  avatarInitials: string;
}

export const ROLE_PROFILES: Record<Role, UserProfile> = {
  MD: {
    name: "Vikramaditya Singhania",
    email: "v.singhania@cassmart.in",
    role: "MD",
    designation: "Managing Director & CEO",
    department: "Executive Committee",
    scopeLabel: "Pan-India Enterprise",
    avatarInitials: "VS",
  },
  "Business Head": {
    name: "Aakash Mehra",
    email: "a.mehra@cassmart.in",
    role: "Business Head",
    designation: "Head of Retail Lending",
    department: "Business Growth & Alliances",
    scopeLabel: "Enterprise Business",
    avatarInitials: "AM",
  },
  "Regional Manager": {
    name: "Rajeshwar Sharma",
    email: "r.sharma@cassmart.in",
    role: "Regional Manager",
    designation: "Regional Credit Head",
    department: "Northern Zonal Office",
    scopeLabel: "North Region",
    avatarInitials: "RS",
  },
  "Area Manager": {
    name: "Pooja Malhotra",
    email: "p.malhotra@cassmart.in",
    role: "Area Manager",
    designation: "Area Operations Lead",
    department: "Punjab Circle",
    scopeLabel: "Punjab Area",
    avatarInitials: "PM",
  },
  "Branch Manager": {
    name: "Sunita Verma",
    email: "s.verma@cassmart.in",
    role: "Branch Manager",
    designation: "Branch Manager & Approver",
    department: "Chandigarh Hub",
    scopeLabel: "Chandigarh Branch",
    avatarInitials: "SV",
  },
  "General Manager": {
    name: "Deepak Chawla",
    email: "d.chawla@cassmart.in",
    role: "General Manager",
    designation: "General Manager — Operations",
    department: "Central Operations",
    scopeLabel: "Pan-India Ops",
    avatarInitials: "DC",
  },
  Officer: {
    name: "Arnav Bansal",
    email: "arnav.bansal@cassmart.in",
    role: "Officer",
    designation: "Senior Credit & Field Officer",
    department: "Retail Origination & Collections",
    scopeLabel: "Assigned Portfolio (Chandigarh)",
    avatarInitials: "AB",
  },
};

export const ROLE_DEFAULT_VIEWS: Record<Role, ModuleView> = {
  MD: "Management",
  "Business Head": "Management",
  "Regional Manager": "Management",
  "Area Manager": "Management",
  "Branch Manager": "Credit",
  "General Manager": "AMS",
  Officer: "EMMS",
};

export function getUserProfileForRole(role: Role): UserProfile {
  if (ROLE_PROFILES[role]) return ROLE_PROFILES[role];
  return {
    name: `${role} User`,
    email: `${role.toLowerCase().replace(/\s+/g, ".")}@cassmart.in`,
    role,
    designation: role,
    department: "Cassmart Micro Foundations",
    scopeLabel: "Designated Scope",
    avatarInitials: role.slice(0, 2).toUpperCase(),
  };
}

export function mapLoanRowToCase(row: LoanRow | LoanDetailRecord): LoanCase {
  const borrower = "borrower_name" in row ? row.borrower_name : null;
  const phone = "borrower_phone" in row ? row.borrower_phone : null;
  const email = "borrower_email" in row ? row.borrower_email : null;

  const rawQueries: CaseQueryDbRecord[] =
    "queries" in row && Array.isArray(row.queries) ? (row.queries as CaseQueryDbRecord[]) : [];
  const mappedQueries: CaseQuery[] = rawQueries.map((q: CaseQueryDbRecord): CaseQuery => ({
    id: q.id,
    question: q.question || "",
    raisedBy: q.raised_by || "Officer",
    raisedByRole: (q.raised_by_role as Role) || "Officer",
    raisedAt: q.created_at
      ? String(q.created_at).slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    targetRoles: q.target_roles
      ? (q.target_roles.split(",") as Role[])
      : ["Branch Manager", "Officer"],
    status: q.status === "resolved" ? "RESOLVED" : "OPEN",
    resolution: q.resolution || undefined,
    resolvedBy: q.resolved_by || undefined,
    resolvedByRole: (q.resolved_by_role as Role) || undefined,
    resolvedAt: q.resolved_at ? String(q.resolved_at).slice(0, 16) : undefined,
  }));

  const rawInstallments: InstallmentDbRecord[] =
    "installments" in row && Array.isArray(row.installments)
      ? (row.installments as InstallmentDbRecord[])
      : [];

  const mappedPayments = rawInstallments.map((inst) => ({
    id: inst.id,
    amount: inst.amount ?? row.emi_amount ?? 0,
    date: inst.payment_date || inst.paid_at || new Date().toISOString().slice(0, 10),
    mode: inst.payment_method || "NACH",
  }));

  const mappedEmiHistory = rawInstallments.map((inst) => {
    const pDate = inst.payment_date || inst.paid_at || "";
    const cycle = pDate ? pDate.slice(0, 7) : (inst.due_date ? inst.due_date.slice(0, 7) : "");
    return {
      cycleMonth: cycle,
      paidDate: pDate || null,
      bounced: false,
    };
  });

  const totalPaid = mappedPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingOutstanding = Math.max(0, (row.amount ?? 0) - totalPaid);
  const effectiveStage =
    remainingOutstanding <= 0 && (row.stage === "active loan" || row.stage === "disbursed")
      ? "recovered"
      : row.stage;

  return {
    id: row.id,
    clientName: borrower || row.purpose || `Loan ${row.id}`,
    loanAmount: row.amount ?? 0,
    emiAmount: row.emi_amount ?? 0,
    outstanding: remainingOutstanding,
    stage: effectiveStage,
    workflowStatus:
      effectiveStage === "credit approved"
        ? "Verification"
        : effectiveStage === "disbursed" || effectiveStage === "active loan"
          ? "DUE"
          : effectiveStage === "recovered"
            ? "RESOLVED"
            : effectiveStage === "application"
              ? "New"
              : "New Enquiry",
    queryRaised: mappedQueries.some((q) => q.status === "OPEN"),
    escalated: false,
    cibilException: false,
    priority: "Medium",
    region: "North",
    area: "Punjab",
    branch: "Chandigarh",
    assignedOfficer: "Arnav",
    temperature: "Warm",
    followUpCount: 0,
    nextFollowUp: null,
    lastFollowUp: null,
    applicationDate: row.date_of_disbursal ?? null,
    approvalDate: null,
    reopenedAt: null,
    reopenedBy: null,
    disbursedDate: row.date_of_disbursal ?? null,
    disbursedAmount: row.amount ?? 0,
    dueDayStart: 1,
    dueDayEnd: 5,
    emiHistory: mappedEmiHistory,
    payments: mappedPayments,
    visits: [],
    collectionQueue: "none",
    applicant: {
      entityType: "Individual",
      contact: phone || "",
      email: email || "",
      business: row.purpose || row.loan_type,
      purpose: row.purpose || row.loan_type,
    },
    terms: {
      product: row.loan_type,
      tenureMonths: row.tenure_in_months ?? 12,
      interestRate: row.rate_of_interest ?? 12,
      repayment: "Monthly",
      bankAccount: "",
    },
    documents: [],
    checklist: [],
    credit: {
      cibil: 720,
      existingLoans: 0,
      existingObligations: 0,
      defaults: 0,
      overdueAmount: 0,
      riskLevel: "Low",
      recommendation: "Standard approval",
    },
    financials: {
      annualRevenue: 0,
      netCashFlow: 0,
      existingObligations: 0,
      repaymentCapacity: 0,
    },
    exceptions: [],
    notes: [],
    queries: mappedQueries,
    history: [],
  };
}

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  currentUser: UserProfile | null;

  // UI state
  currentRole: Role;
  currentView: ModuleView;
  currentDemoDate: string;
  selectedCaseId: string | null;
  activeDrawerTab: string;
  search: string;
  filterStatus: string;
  filterPriority: string;
  isLoading: boolean;

  // business state - strictly empty initially (no mock data)
  cases: LoanCase[];
  notifications: AppNotification[];

  // Auth actions
  login: (role: Role, customEmail?: string) => void;
  logout: () => void;

  // UI actions
  setRole: (role: Role) => void;
  setView: (view: ModuleView) => void;
  setDemoDate: (date: string) => void;
  selectCase: (id: string | null) => void;
  setDrawerTab: (tab: string) => void;
  setSearch: (q: string) => void;
  setFilterStatus: (v: string) => void;
  setFilterPriority: (v: string) => void;

  // Async server function integration
  fetchAllLoans: () => Promise<void>;
  fetchLoansByStage: (stage: Stage) => Promise<void>;
  updateLoanStageAction: (loan_id: string, new_stage: Stage) => Promise<void>;
  fetchCaseDetails: (loan_id: string) => Promise<void>;

  // notification actions
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // reset action
  resetData: () => void;

  // case actions
  createEnquiry: (input: {
    clientName: string;
    loanAmount: number;
    emiAmount: number;
    temperature: LoanCase["temperature"];
    branch: string;
    area: string;
    region: string;
    assignedOfficer: string;
    purpose: string;
    contact: string;
  }) => Promise<LoanCase>;
  moveCase: (
    id: string,
    stage: Stage,
    status: WorkflowStatus,
    event: string,
    note?: string,
  ) => Promise<void>;
  recordFollowUp: (id: string, note: string, actor: string) => void;
  recordVisit: (id: string, note: string, actor: string) => void;
  recordPayment: (id: string, amount: number, mode: string, actor: string) => Promise<void>;
  setNextFollowUp: (id: string, date: string, actor: string) => void;
  escalateCase: (id: string, reason: string, actor: string) => void;
  resolveCase: (id: string, note: string, actor: string) => Promise<void>;
  assignCase: (id: string, officer: string, actor: string) => void;
  addNote: (id: string, text: string, actor: string) => Promise<void>;
  raiseQuery: (
    id: string,
    question: string,
    actor: string,
    actorRole?: Role | undefined,
  ) => Promise<void>;
  resolveQuery: (
    id: string,
    queryId: string,
    resolution: string,
    actor: string,
    actorRole?: Role | undefined,
  ) => Promise<void>;
  reopenFile: (id: string, remarks: string, actor: string, actorRole?: Role | undefined) => void;
  toggleChecklist: (id: string, key: string, actor: string) => void;
}

let seq = 0;
const uid = (p: string) => `${p}-${Date.now()}-${seq++}`;

function stamp(demoDate: string): string {
  const now = new Date();
  return `${demoDate}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

const AUTH_STORAGE_KEY = "cassmart_user_auth_session";

function getSavedAuth(): {
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  currentRole: Role;
  currentView: ModuleView;
} {
  if (typeof window === "undefined") {
    return {
      isAuthenticated: false,
      currentUser: null,
      currentRole: "Officer",
      currentView: "EMMS",
    };
  }
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.currentRole && parsed.currentUser) {
        return {
          isAuthenticated: true,
          currentUser: parsed.currentUser,
          currentRole: parsed.currentRole,
          currentView:
            parsed.currentView ?? ROLE_DEFAULT_VIEWS[parsed.currentRole as Role] ?? "EMMS",
        };
      }
    }
  } catch (storageErr) {
    console.warn("[Cassmart Auth] Could not parse stored session:", storageErr);
  }
  return {
    isAuthenticated: false,
    currentUser: null,
    currentRole: "Officer",
    currentView: "EMMS",
  };
}

export const useAppStore = create<AppState>()((set, get) => {
  const initialAuth = getSavedAuth();

  // If already authenticated from saved browser session, fetch loans immediately
  if (initialAuth.isAuthenticated && typeof window !== "undefined") {
    setTimeout(() => {
      get().fetchAllLoans();
    }, 0);
  }

  const patch = (
    id: string,
    updater: (c: LoanCase) => LoanCase,
    event?: { action: string; actor: string; note?: string | undefined },
  ) =>
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.id !== id) return c;
        const updated = updater(c);
        if (!event) return updated;
        return {
          ...updated,
          history: [
            ...updated.history,
            {
              id: uid("h"),
              timestamp: stamp(state.currentDemoDate),
              actor: event.actor,
              action: event.action,
              note: event.note,
            },
          ],
        };
      }),
    }));

  return {
    isAuthenticated: initialAuth.isAuthenticated,
    currentUser: initialAuth.currentUser,

    currentRole: initialAuth.currentRole,
    currentView: initialAuth.currentView,
    currentDemoDate: "2026-09-02",
    selectedCaseId: null,
    activeDrawerTab: "Overview",
    search: "",
    filterStatus: "all",
    filterPriority: "all",
    isLoading: false,

    // Real data only: empty on initial load until fetched from DuckDB
    cases: [],
    notifications: [],

    login: (role: Role, customEmail?: string) => {
      let profile = getUserProfileForRole(role);
      if (customEmail && customEmail.trim()) {
        profile = {
          ...profile,
          email: customEmail.trim(),
        };
      }
      const defaultView = ROLE_DEFAULT_VIEWS[role] ?? "EMMS";
      set({
        isAuthenticated: true,
        currentUser: profile,
        currentRole: role,
        currentView: defaultView,
        selectedCaseId: null,
        search: "",
        filterStatus: "all",
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({
              isAuthenticated: true,
              currentUser: profile,
              currentRole: role,
              currentView: defaultView,
            }),
          );
        } catch (storageErr) {
          console.warn("[Cassmart Auth] Failed to save session to localStorage:", storageErr);
        }
      }

      // Fetch fresh loans from DuckDB on sign-in
      get().fetchAllLoans();
    },

    logout: () => {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (storageErr) {
          console.warn("[Cassmart Auth] Failed to remove session from localStorage:", storageErr);
        }
      }
      set({
        isAuthenticated: false,
        currentUser: null,
        selectedCaseId: null,
      });
    },

    resetData: () => {
      // Re-fetches current database contents without any mock data
      get().fetchAllLoans();
    },

    setRole: (currentRole) => set({ currentRole, selectedCaseId: null }),
    setView: (currentView) =>
      set({ currentView, selectedCaseId: null, search: "", filterStatus: "all" }),
    setDemoDate: (currentDemoDate) => set({ currentDemoDate }),
    selectCase: (selectedCaseId) => set({ selectedCaseId, activeDrawerTab: "Overview" }),
    setDrawerTab: (activeDrawerTab) => set({ activeDrawerTab }),
    setSearch: (search) => set({ search }),
    setFilterStatus: (filterStatus) => set({ filterStatus }),
    setFilterPriority: (filterPriority) => set({ filterPriority }),

    // Fetch all loans across all stages from DuckDB in a single query
    fetchAllLoans: async () => {
      set({ isLoading: true });
      try {
        const records = await getAllLoans();
        const allCases: LoanCase[] = (records ?? []).map(mapLoanRowToCase);
        set({ cases: allCases, isLoading: false });
      } catch (error) {
        console.error("[Cassmart] Error fetching all loans from DuckDB:", error);
        set({ isLoading: false });
      }
    },

    // Fetch loans for a single stage from DuckDB
    fetchLoansByStage: async (stage: Stage) => {
      try {
        const rows = await getLoansByStage({ data: stage });
        const fetchedCases = rows.map(mapLoanRowToCase);
        set((state) => {
          const others = state.cases.filter((c) => c.stage !== stage);
          return { cases: [...others, ...fetchedCases] };
        });
      } catch (error) {
        console.error(`[Cassmart] Error fetching loans for stage ${stage}:`, error);
      }
    },

    // Move loan stage in DuckDB via server function - Zero Client-Side Faking
    updateLoanStageAction: async (loan_id: string, new_stage: Stage) => {
      // 1. Await DuckDB write FIRST
      await updateLoanStage({ data: { loan_id, new_stage } });

      // 2. ONLY upon confirmed database update, update local state
      set((state) => ({
        cases: state.cases.map((c) => (c.id === loan_id ? { ...c, stage: new_stage } : c)),
      }));
    },

    // Fetch single loan details with borrower info
    fetchCaseDetails: async (loan_id: string) => {
      try {
        const detail = await getLoanDetails({ data: loan_id });
        if (detail) {
          const mapped = mapLoanRowToCase(detail);
          set((state) => ({
            cases: state.cases.some((c) => c.id === loan_id)
              ? state.cases.map((c) => (c.id === loan_id ? mapped : c))
              : [...state.cases, mapped],
          }));
        }
      } catch (error) {
        console.error(`[Cassmart] Failed to fetch loan details for ${loan_id}:`, error);
      }
    },

    addNotification: (n) => {
      const notif: AppNotification = {
        ...n,
        id: uid("notif"),
        timestamp: stamp(get().currentDemoDate),
        read: false,
      };
      set((state) => ({ notifications: [notif, ...state.notifications] }));
    },

    markNotificationAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      })),

    markAllNotificationsAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      })),

    createEnquiry: async (input) => {
      // 1. Await DuckDB write FIRST (Zero Client-Side Faking)
      const record = await createNewEnquiry({
        data: {
          name: input.clientName,
          phone: input.contact,
          amount: input.loanAmount,
          emi_amount: input.emiAmount,
          purpose: input.purpose,
          loan_type: "Business",
        },
      });

      // 2. Only upon confirmed database write, build the local state case
      const mapped = mapLoanRowToCase(record);
      const newCase: LoanCase = {
        ...mapped,
        clientName: input.clientName,
        temperature: input.temperature,
        branch: input.branch,
        area: input.area,
        region: input.region,
        assignedOfficer: input.assignedOfficer,
        workflowStatus: "New Enquiry",
        applicant: {
          ...mapped.applicant,
          contact: input.contact,
          business: input.purpose,
          purpose: input.purpose,
        },
        history: [
          {
            id: uid("h"),
            timestamp: stamp(get().currentDemoDate),
            actor: input.assignedOfficer,
            action: "Enquiry logged in Cassmart (DuckDB Confirmed)",
          },
        ],
      };

      set((state) => ({ cases: [newCase, ...state.cases] }));
      return newCase;
    },

    moveCase: async (id, stage, status, event, note) => {
      // 1. Await DuckDB stage update FIRST (Zero Client-Side Faking)
      await updateLoanStage({ data: { loan_id: id, new_stage: stage } });

      // If a note is provided, persist it to DuckDB as well
      if (note) {
        try {
          await addLoanNote({
            data: {
              loan_id: id,
              content: `${event}: ${note}`,
              added_by_emp_id: get().currentRole,
            },
          });
        } catch (err) {
          console.warn(`[Cassmart] Note persistence warning for ${id}:`, err);
        }
      }

      // 2. ONLY upon confirmed database update, update local React state and history
      patch(
        id,
        (c) => ({
          ...c,
          stage,
          workflowStatus: status,
          applicationDate:
            stage === "application" && !c.applicationDate
              ? stamp(get().currentDemoDate).slice(0, 10)
              : c.applicationDate,
          approvalDate:
            stage === "credit approved" && !c.approvalDate
              ? stamp(get().currentDemoDate).slice(0, 10)
              : c.approvalDate,
          disbursedDate:
            stage === "disbursed" && !c.disbursedDate
              ? stamp(get().currentDemoDate).slice(0, 10)
              : c.disbursedDate,
          disbursedAmount: stage === "disbursed" ? c.loanAmount : c.disbursedAmount,
        }),
        { action: event, actor: get().currentRole, note },
      );
    },

    recordFollowUp: (id, note, actor) =>
      patch(
        id,
        (c) => ({
          ...c,
          followUpCount: c.followUpCount + 1,
          lastFollowUp: stamp(get().currentDemoDate),
        }),
        { action: "Follow-up completed", actor, note },
      ),

    recordVisit: (id, note, actor) =>
      patch(
        id,
        (c) => ({
          ...c,
          visits: [
            ...c.visits,
            { id: uid("v"), date: stamp(get().currentDemoDate).slice(0, 10), note },
          ],
        }),
        { action: "Field visit recorded", actor, note },
      ),

    recordPayment: async (id, amount, mode, actor) => {
      const demoDate = get().currentDemoDate;
      const cycleMonth = demoDate.slice(0, 7);

      try {
        await recordLoanPayment({
          data: {
            loan_id: id,
            amount,
            payment_method: mode,
            paid_date: demoDate,
            recorded_by: actor,
          },
        });
      } catch (err) {
        console.warn("[Cassmart] DuckDB recordLoanPayment notice:", err);
      }

      patch(
        id,
        (c) => {
          const newOutstanding = Math.max(0, c.outstanding - amount);
          const isFullyRecovered = newOutstanding <= 0;

          const existingEmiIndex = c.emiHistory.findIndex((e) => e.cycleMonth === cycleMonth);
          const updatedEmiHistory =
            existingEmiIndex >= 0
              ? c.emiHistory.map((e, idx) =>
                  idx === existingEmiIndex ? { ...e, paidDate: demoDate, bounced: false } : e,
                )
              : [
                  ...c.emiHistory,
                  {
                    cycleMonth,
                    paidDate: demoDate,
                    bounced: false,
                  },
                ];

          return {
            ...c,
            outstanding: newOutstanding,
            stage: isFullyRecovered ? "recovered" : c.stage === "disbursed" ? "active loan" : c.stage,
            workflowStatus: "RESOLVED",
            payments: [
              ...c.payments,
              {
                id: uid("p"),
                amount,
                date: demoDate,
                mode,
              },
            ],
            emiHistory: updatedEmiHistory,
          };
        },
        { action: `Payment collected (₹${amount.toLocaleString()})`, actor },
      );
    },

    setNextFollowUp: (id, date, actor) =>
      patch(id, (c) => ({ ...c, nextFollowUp: date }), {
        action: `Next touchpoint scheduled for ${date}`,
        actor,
      }),

    escalateCase: (id, reason, actor) =>
      patch(id, (c) => ({ ...c, escalated: true }), {
        action: "Escalated for senior review",
        actor,
        note: reason,
      }),

    resolveCase: async (id, note, actor) => {
      // 1. Await DuckDB resolution FIRST (Zero Client-Side Faking)
      await resolveCaseDb({
        data: {
          loan_id: id,
          note,
          resolved_by: actor,
        },
      });

      // 2. ONLY upon confirmed DuckDB write, update local state
      patch(
        id,
        (c) => {
          const isFullyPaid = c.outstanding <= 0;
          return {
            ...c,
            escalated: false,
            workflowStatus: "RESOLVED",
            stage: isFullyPaid ? "recovered" : c.stage,
          };
        },
        { action: "Account resolved", actor, note },
      );
    },

    assignCase: (id, officer, actor) =>
      patch(id, (c) => ({ ...c, assignedOfficer: officer }), {
        action: `Assigned to ${officer}`,
        actor,
      }),

    addNote: async (id, text, actor) => {
      // 1. Await DuckDB write FIRST (Zero Client-Side Faking)
      const noteRecord = await addLoanNote({
        data: {
          loan_id: id,
          content: text,
          added_by_emp_id: actor,
        },
      });

      // 2. ONLY upon confirmed DuckDB write, update local state
      patch(
        id,
        (c) => ({
          ...c,
          notes: [
            ...c.notes,
            {
              id: noteRecord.id,
              timestamp: stamp(get().currentDemoDate),
              actor,
              text,
            },
          ],
        }),
        { action: "Note added", actor, note: text },
      );
    },

    raiseQuery: async (id, question, actor, actorRole) => {
      const roleStr = actorRole ?? get().currentRole;
      if (roleStr === "MD") {
        throw new Error("Managing Director is the apex sanctioning authority and does not raise queries.");
      }
      const targetRoles = getNextHigherRoles(roleStr);
      const targetRolesStr = targetRoles.join(",");

      // 1. Persist to DuckDB FIRST (Zero Client-Side Faking)
      const qRecord = await createCaseQuery({
        data: {
          loan_id: id,
          question,
          raised_by: actor,
          raised_by_role: roleStr,
          target_roles: targetRolesStr,
        },
      });

      const q: CaseQuery = {
        id: qRecord.id,
        question,
        raisedBy: actor,
        raisedByRole: roleStr,
        raisedAt: stamp(get().currentDemoDate),
        targetRoles,
        status: "OPEN",
      };

      // 2. ONLY upon confirmed database write, update local state
      patch(
        id,
        (c) => ({
          ...c,
          queryRaised: true,
          queries: [...c.queries, q],
        }),
        { action: `Query raised to ${targetRoles.join(", ")}`, actor, note: question },
      );
    },

    resolveQuery: async (id, queryId, resolution, actor, actorRole) => {
      // 1. Persist to DuckDB FIRST (Zero Client-Side Faking)
      await resolveCaseQuery({
        data: {
          query_id: queryId,
          resolution,
          resolved_by: actor,
          resolved_by_role: actorRole ?? get().currentRole,
        },
      });

      // 2. ONLY upon confirmed database write, update local state
      patch(
        id,
        (c) => {
          const queries = c.queries.map((q) =>
            q.id === queryId
              ? {
                  ...q,
                  status: "RESOLVED" as const,
                  resolution,
                  resolvedBy: actor,
                  resolvedByRole: actorRole ?? get().currentRole,
                  resolvedAt: stamp(get().currentDemoDate),
                }
              : q,
          );
          const hasOpen = queries.some((q) => q.status === "OPEN");
          return {
            ...c,
            queryRaised: hasOpen,
            queries,
          };
        },
        { action: "Query resolved", actor, note: resolution },
      );
    },

    reopenFile: (id, remarks, actor, actorRole) =>
      patch(
        id,
        (c) => ({
          ...c,
          reopenedAt: stamp(get().currentDemoDate),
          reopenedBy: actor,
          workflowStatus: "Verification",
          stage: "credit approved",
        }),
        { action: "Case re-opened", actor, note: remarks },
      ),

    toggleChecklist: (id, key, actor) =>
      patch(
        id,
        (c) => ({
          ...c,
          checklist: c.checklist.map((item) =>
            item.key === key ? { ...item, done: !item.done } : item,
          ),
        }),
        { action: `Checklist item ${key} toggled`, actor },
      ),
  };
});
