import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dataProvider } from "@/data/dataProvider";
import type {
  AppNotification,
  CaseQuery,
  LoanCase,
  ModuleView,
  Role,
  Stage,
  WorkflowStatus,
} from "@/types/loan";
import { TRANSITIONS } from "@/utils/transitions";

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
    email: "v.singhania@nbfc-finance.in",
    role: "MD",
    designation: "Managing Director & CEO",
    department: "Executive Committee",
    scopeLabel: "Pan-India Enterprise",
    avatarInitials: "VS",
  },
  "Business Head": {
    name: "Aakash Mehra",
    email: "a.mehra@nbfc-finance.in",
    role: "Business Head",
    designation: "Head of Retail Lending",
    department: "Business Growth & Alliances",
    scopeLabel: "Enterprise Business",
    avatarInitials: "AM",
  },
  "Regional Manager": {
    name: "Rajeshwar Sharma",
    email: "r.sharma@nbfc-finance.in",
    role: "Regional Manager",
    designation: "Regional Credit Head",
    department: "Northern Zonal Office",
    scopeLabel: "North Region",
    avatarInitials: "RS",
  },
  "Area Manager": {
    name: "Pooja Malhotra",
    email: "p.malhotra@nbfc-finance.in",
    role: "Area Manager",
    designation: "Area Operations Lead",
    department: "Punjab Circle",
    scopeLabel: "Punjab Area",
    avatarInitials: "PM",
  },
  "Branch Manager": {
    name: "Sunita Verma",
    email: "s.verma@nbfc-finance.in",
    role: "Branch Manager",
    designation: "Branch Manager & Approver",
    department: "Chandigarh Hub",
    scopeLabel: "Chandigarh Branch",
    avatarInitials: "SV",
  },
  "General Manager": {
    name: "Deepak Chawla",
    email: "d.chawla@nbfc-finance.in",
    role: "General Manager",
    designation: "General Manager — Operations",
    department: "Central Operations",
    scopeLabel: "Pan-India Ops",
    avatarInitials: "DC",
  },
  Officer: {
    name: "Arnav Bansal",
    email: "arnav.bansal@nbfc-finance.in",
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
    email: `${role.toLowerCase().replace(/\s+/g, ".")}@nbfc-finance.in`,
    role,
    designation: role,
    department: "NBFC Lending Operations",
    scopeLabel: "Designated Scope",
    avatarInitials: role.slice(0, 2).toUpperCase(),
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

  // business state
  cases: LoanCase[];
  notifications: AppNotification[];

  // Auth actions
  login: (role: Role) => void;
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
  }) => void;
  moveCase: (
    id: string,
    stage: Stage,
    status: WorkflowStatus,
    event: string,
    note?: string,
  ) => void;
  recordFollowUp: (id: string, note: string, actor: string) => void;
  recordVisit: (id: string, note: string, actor: string) => void;
  recordPayment: (id: string, amount: number, mode: string, actor: string) => void;
  setNextFollowUp: (id: string, date: string, actor: string) => void;
  escalateCase: (id: string, reason: string, actor: string) => void;
  resolveCase: (id: string, note: string, actor: string) => void;
  assignCase: (id: string, officer: string, actor: string) => void;
  addNote: (id: string, text: string, actor: string) => void;
  raiseQuery: (id: string, question: string, actor: string, actorRole?: Role | undefined) => void;
  resolveQuery: (
    id: string,
    queryId: string,
    resolution: string,
    actor: string,
    actorRole?: Role | undefined,
  ) => void;
  reopenFile: (id: string, remarks: string, actor: string, actorRole?: Role | undefined) => void;
  toggleChecklist: (id: string, key: string, actor: string) => void;
}

let seq = 0;
const uid = (p: string) => `${p}-${Date.now()}-${seq++}`;

function stamp(demoDate: string): string {
  const now = new Date();
  return `${demoDate}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    caseId: "CASE-001",
    caseName: "Arvind Agritech Pvt. Ltd.",
    title: "High-Priority Enquiry",
    message: "Hot lead enquiry assigned to Arnav. Scheduled follow-up pending.",
    type: "followup",
    targetRoles: ["Officer", "Branch Manager"],
    targetOfficer: "Arnav",
    timestamp: "2026-09-02T09:30",
    read: false,
  },
  {
    id: "notif-2",
    caseId: "CASE-005",
    caseName: "Malhotra Infotech",
    title: "CIBIL Policy Deviation",
    message: "Application requires deviation approval (CIBIL score below cutoff).",
    type: "approval",
    targetRoles: ["Regional Manager", "MD"],
    timestamp: "2026-09-01T14:15",
    read: false,
  },
  {
    id: "notif-3",
    caseId: "CASE-011",
    caseName: "Komal Textiles",
    title: "EMI Payment Due Window Open",
    message: "EMI cycle Sept 1 - Sept 5 is active. Repayment due from borrower.",
    type: "due",
    targetRoles: ["Officer", "Branch Manager"],
    targetOfficer: "Arnav",
    timestamp: "2026-09-02T08:00",
    read: false,
  },
];

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
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
        isAuthenticated: false,
        currentUser: null,

        currentRole: "Officer",
        currentView: "EMMS",
        currentDemoDate: dataProvider.getInitialDemoDate(),
        selectedCaseId: null,
        activeDrawerTab: "Overview",
        search: "",
        filterStatus: "all",
        filterPriority: "all",

        cases: dataProvider.getCases(),
        notifications: INITIAL_NOTIFICATIONS,

        login: (role: Role) => {
          const profile = getUserProfileForRole(role);
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
        },

        logout: () => {
          set({
            isAuthenticated: false,
            currentUser: null,
            selectedCaseId: null,
          });
        },

        resetData: () =>
          set((state) => ({
            cases: dataProvider.reset(),
            notifications: INITIAL_NOTIFICATIONS,
            currentDemoDate: dataProvider.getInitialDemoDate(),
            selectedCaseId: null,
            activeDrawerTab: "Overview",
            search: "",
            filterStatus: "all",
            filterPriority: "all",
            isAuthenticated: state.isAuthenticated,
            currentUser: state.currentUser,
          })),

        setRole: (currentRole) => set({ currentRole, selectedCaseId: null }),
        setView: (currentView) =>
          set({ currentView, selectedCaseId: null, search: "", filterStatus: "all" }),
        setDemoDate: (currentDemoDate) => set({ currentDemoDate }),
        selectCase: (selectedCaseId) => set({ selectedCaseId, activeDrawerTab: "Overview" }),
        setDrawerTab: (activeDrawerTab) => set({ activeDrawerTab }),
        setSearch: (search) => set({ search }),
        setFilterStatus: (filterStatus) => set({ filterStatus }),
        setFilterPriority: (filterPriority) => set({ filterPriority }),

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

        createEnquiry: (input) => {
          const template = get().cases[0]!;
          const id = `CASE-${String(100 + get().cases.length).slice(-3)}`;
          const date = get().currentDemoDate;
          const fresh: LoanCase = {
            ...template,
            id,
            clientName: input.clientName,
            loanAmount: input.loanAmount,
            emiAmount: input.emiAmount,
            outstanding: input.loanAmount,
            stage: "enquiry",
            workflowStatus: "New Enquiry",
            queryRaised: false,
            escalated: false,
            priority: input.temperature === "Hot" ? "High" : "Medium",
            region: input.region,
            area: input.area,
            branch: input.branch,
            assignedOfficer: input.assignedOfficer,
            temperature: input.temperature,
            followUpCount: 0,
            nextFollowUp: null,
            lastFollowUp: null,
            applicationDate: null,
            approvalDate: null,
            reopenedAt: null,
            reopenedBy: null,
            disbursedDate: null,
            disbursedAmount: 0,
            emiHistory: [],
            payments: [],
            visits: [],
            collectionQueue: "none",
            applicant: { ...template.applicant, contact: input.contact, purpose: input.purpose },
            exceptions: [],
            notes: [],
            history: [
              {
                id: uid("h"),
                timestamp: stamp(date),
                actor: input.assignedOfficer,
                action: "Enquiry created",
              },
            ],
          };
          set((state) => ({ cases: [fresh, ...state.cases], selectedCaseId: id }));
        },

        moveCase: (id, stage, status, event, note) => {
          const c = get().cases.find((x) => x.id === id);
          patch(
            id,
            (c) => ({
              ...c,
              stage,
              workflowStatus: status,
              queryRaised: stage === "credit_review" ? c.queryRaised : false,
              applicationDate:
                stage === "credit_review" && !c.applicationDate
                  ? get().currentDemoDate
                  : c.applicationDate,
              approvalDate:
                event === TRANSITIONS.approve.event || (stage === "disbursement" && !c.approvalDate)
                  ? get().currentDemoDate
                  : (c.approvalDate ?? null),
              disbursedDate: stage === "collections" ? get().currentDemoDate : c.disbursedDate,
              disbursedAmount: stage === "collections" ? c.loanAmount : c.disbursedAmount,
              collectionQueue: stage === "collections" ? "followup" : c.collectionQueue,
            }),
            { action: event, actor: get().currentRole, note },
          );

          // Trigger targeted notifications on major milestones
          if (event === TRANSITIONS.approve.event) {
            get().addNotification({
              caseId: id,
              caseName: c?.clientName,
              title: "Loan Approved",
              message: `Loan for ${c?.clientName ?? id} approved by ${get().currentRole}. Handed over to Operations.`,
              type: "approval",
              targetRoles: ["Branch Manager", "Regional Manager", "MD", "Officer"],
              targetOfficer: c?.assignedOfficer,
            });
          } else if (event === TRANSITIONS.disburse.event) {
            get().addNotification({
              caseId: id,
              caseName: c?.clientName,
              title: "Funds Disbursed",
              message: `Disbursement completed for ${c?.clientName ?? id}. Repayment schedule is now active.`,
              type: "general",
              targetRoles: ["Branch Manager", "Regional Manager", "Officer"],
              targetOfficer: c?.assignedOfficer,
            });
          } else if (event === TRANSITIONS.convertToApplication.event) {
            get().addNotification({
              caseId: id,
              caseName: c?.clientName,
              title: "Application Submitted to Credit",
              message: `${c?.clientName ?? id} converted to application. Review queue ready.`,
              type: "general",
              targetRoles: ["Branch Manager", "Regional Manager"],
            });
          }
        },

        recordFollowUp: (id, note, actor) =>
          patch(
            id,
            (c) => ({
              ...c,
              followUpCount: c.followUpCount + 1,
              lastFollowUp: get().currentDemoDate,
            }),
            { action: "Follow-up recorded", actor, note },
          ),

        recordVisit: (id, note, actor) =>
          patch(
            id,
            (c) => ({
              ...c,
              visits: [...c.visits, { id: uid("v"), date: get().currentDemoDate, note }],
            }),
            { action: "Field visit recorded", actor, note },
          ),

        recordPayment: (id, amount, mode, actor) =>
          patch(
            id,
            (c) => {
              const date = get().currentDemoDate;
              const cycle = date.slice(0, 7);
              const history = c.emiHistory.some((e) => e.cycleMonth === cycle)
                ? c.emiHistory.map((e) =>
                    e.cycleMonth === cycle ? { ...e, paidDate: date, bounced: e.bounced } : e,
                  )
                : [...c.emiHistory, { cycleMonth: cycle, paidDate: date, bounced: false }];
              return {
                ...c,
                emiHistory: history,
                payments: [...c.payments, { id: uid("p"), amount, date, mode }],
                outstanding: Math.max(0, c.outstanding - amount),
                workflowStatus: "RESOLVED",
                collectionQueue: "none",
              };
            },
            { action: "Payment recorded", actor, note: `Amount received via ${mode}` },
          ),

        setNextFollowUp: (id, date, actor) =>
          patch(id, (c) => ({ ...c, nextFollowUp: date }), {
            action: "Next follow-up scheduled",
            actor,
            note: date,
          }),

        escalateCase: (id, reason, actor) => {
          const c = get().cases.find((x) => x.id === id);
          patch(
            id,
            (c) => ({
              ...c,
              escalated: true,
              workflowStatus: c.stage === "collections" ? "ESCALATED" : c.workflowStatus,
              priority: "Critical",
            }),
            { action: "Case escalated", actor, note: reason },
          );
          get().addNotification({
            caseId: id,
            caseName: c?.clientName,
            title: "Case Escalated",
            message: `${actor} escalated ${c?.clientName ?? id}: "${reason || "Immediate executive intervention required"}"`,
            type: "escalation",
            targetRoles: ["Branch Manager", "Regional Manager", "MD"],
          });
        },

        resolveCase: (id, note, actor) => {
          const c = get().cases.find((x) => x.id === id);
          patch(
            id,
            (c) => ({
              ...c,
              workflowStatus: TRANSITIONS.resolve.status,
              escalated: false,
              collectionQueue: "none",
            }),
            { action: "Case resolved", actor, note },
          );
          get().addNotification({
            caseId: id,
            caseName: c?.clientName,
            title: "Case Resolved",
            message: `Delinquency/escalation on ${c?.clientName ?? id} marked resolved by ${actor}.`,
            type: "general",
            targetRoles: ["Officer", "Branch Manager", "Regional Manager"],
            targetOfficer: c?.assignedOfficer,
          });
        },

        assignCase: (id, officer, actor) => {
          const c = get().cases.find((x) => x.id === id);
          patch(id, (c) => ({ ...c, assignedOfficer: officer }), {
            action: "Case assigned",
            actor,
            note: `Owner set to ${officer}`,
          });
          get().addNotification({
            caseId: id,
            caseName: c?.clientName,
            title: "Case Assigned to You",
            message: `Case ${c?.clientName ?? id} assigned to ${officer} by ${actor}.`,
            type: "assignment",
            targetRoles: ["Officer", "Branch Manager"],
            targetOfficer: officer,
          });
        },

        addNote: (id, text, actor) =>
          patch(
            id,
            (c) => ({
              ...c,
              notes: [
                { id: uid("n"), timestamp: stamp(get().currentDemoDate), actor, text },
                ...c.notes,
              ],
            }),
            { action: "Note added", actor, note: text },
          ),

        raiseQuery: (id, question, actor, actorRole) => {
          const role = actorRole ?? get().currentRole;
          let targetRoles: Role[];
          if (role === "Officer") {
            targetRoles = ["Branch Manager"];
          } else if (role === "Branch Manager") {
            targetRoles = ["Regional Manager"];
          } else if (role === "Regional Manager") {
            targetRoles = ["Branch Manager"];
          } else {
            targetRoles = ["Branch Manager"];
          }

          const queryId = uid("qry");
          const newQuery: CaseQuery = {
            id: queryId,
            question,
            raisedBy: actor,
            raisedByRole: role,
            raisedAt: stamp(get().currentDemoDate),
            targetRoles,
            status: "OPEN",
          };

          const noteObj = {
            id: uid("n"),
            timestamp: stamp(get().currentDemoDate),
            actor,
            text: `Query Raised: "${question}"`,
          };

          patch(
            id,
            (c) => ({
              ...c,
              queryRaised: true,
              workflowStatus: "In Review",
              queries: [newQuery, ...(c.queries ?? [])],
              notes: [noteObj, ...c.notes],
            }),
            {
              action: "Query raised",
              actor,
              note: question,
            },
          );

          const c = get().cases.find((x) => x.id === id);
          get().addNotification({
            caseId: id,
            caseName: c?.clientName,
            title:
              role === "Officer"
                ? `Officer Query: ${actor}`
                : role === "Branch Manager"
                  ? `Branch Query: ${actor}`
                  : "Query Raised",
            message: `${actor} (${role}) submitted query to ${targetRoles.join(", ")} on ${c?.clientName ?? id}: "${question}"`,
            type: "query",
            targetRoles,
            targetOfficer: c?.assignedOfficer,
          });
        },

        resolveQuery: (id, queryId, resolution, actor, actorRole) => {
          const role = actorRole ?? get().currentRole;
          const caseObj = get().cases.find((x) => x.id === id);
          const targetQ = caseObj?.queries?.find((q) => q.id === queryId);
          if (targetQ) {
            const isAuthor =
              targetQ.raisedBy === actor ||
              targetQ.raisedByRole === role ||
              (role === "Officer" && targetQ.raisedBy === caseObj?.assignedOfficer);
            if (isAuthor) {
              console.warn("Self-resolution prevented: author cannot resolve their own query");
              return;
            }
          }

          const noteObj = {
            id: uid("n"),
            timestamp: stamp(get().currentDemoDate),
            actor,
            text: `Query Resolved: "${resolution}"`,
          };

          patch(
            id,
            (c) => {
              const updatedQueries = (c.queries ?? []).map((q) =>
                q.id === queryId
                  ? {
                      ...q,
                      status: "RESOLVED" as const,
                      resolution,
                      resolvedBy: actor,
                      resolvedByRole: role,
                      resolvedAt: stamp(get().currentDemoDate),
                    }
                  : q,
              );
              const hasOpenQueries = updatedQueries.some((q) => q.status === "OPEN");
              return {
                ...c,
                queryRaised: hasOpenQueries,
                workflowStatus: hasOpenQueries ? c.workflowStatus : "In Review",
                queries: updatedQueries,
                notes: [noteObj, ...c.notes],
              };
            },
            {
              action: "Query resolved",
              actor,
              note: resolution,
            },
          );

          const c = get().cases.find((x) => x.id === id);
          const notifyRoles: Role[] =
            role === "Branch Manager"
              ? ["Officer", "Regional Manager"]
              : role === "Regional Manager"
                ? ["Branch Manager"]
                : ["Branch Manager", "Regional Manager"];

          get().addNotification({
            caseId: id,
            caseName: c?.clientName,
            title: "Query Resolved",
            message: `${actor} (${role}) resolved query on ${c?.clientName ?? id}: "${resolution}"`,
            type: "query",
            targetRoles: notifyRoles,
            targetOfficer: c?.assignedOfficer,
          });
        },

        reopenFile: (id, remarks, actor, actorRole) => {
          const role = actorRole ?? get().currentRole;
          if (role !== "Regional Manager" && role !== "MD" && role !== "Area Manager") {
            console.warn("Only Regional Manager and MD can re-open files in SLA Attention");
            return;
          }

          const noteObj = {
            id: uid("n"),
            timestamp: stamp(get().currentDemoDate),
            actor,
            text: `File Re-opened by ${role}: "${remarks}"`,
          };

          patch(
            id,
            (c) => ({
              ...c,
              stage: "disbursement",
              workflowStatus: "Verification",
              approvalDate: get().currentDemoDate, // Reset SLA clock with extension
              reopenedAt: stamp(get().currentDemoDate),
              reopenedBy: actor,
              notes: [noteObj, ...c.notes],
            }),
            {
              action: "File re-opened by executive authority",
              actor,
              note: remarks,
            },
          );

          const c = get().cases.find((x) => x.id === id);
          get().addNotification({
            caseId: id,
            caseName: c?.clientName,
            title: "SLA File Re-Opened",
            message: `${actor} (${role}) re-opened file for ${c?.clientName ?? id}: "${remarks}". Returned to Verification.`,
            type: "general",
            targetRoles: ["Branch Manager", "Officer"],
            targetOfficer: c?.assignedOfficer,
          });
        },

        toggleChecklist: (id, key, actor) =>
          patch(
            id,
            (c) => ({
              ...c,
              checklist: c.checklist.map((i) => (i.key === key ? { ...i, done: !i.done } : i)),
            }),
            {
              action: "Verification checklist updated",
              actor,
            },
          ),
      };
    },
    {
      name: "nbfc-erp-storage-v4",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : dummyStorage,
      ),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        cases: state.cases,
        notifications: state.notifications,
        currentRole: state.currentRole,
        currentView: state.currentView,
        currentDemoDate: state.currentDemoDate,
        selectedCaseId: state.selectedCaseId,
        activeDrawerTab: state.activeDrawerTab,
      }),
    },
  ),
);

export const useCases = () => useAppStore((s) => s.cases);
export const useSelectedCase = () =>
  useAppStore((s) => s.cases.find((c) => c.id === s.selectedCaseId) ?? null);
