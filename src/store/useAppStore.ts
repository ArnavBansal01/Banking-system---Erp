import { create } from "zustand";
import { dataProvider } from "@/data/dataProvider";
import type { LoanCase, ModuleView, Role, Stage, WorkflowStatus } from "@/types/loan";
import { TRANSITIONS } from "@/utils/transitions";

interface AppState {
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

  // UI actions
  setRole: (role: Role) => void;
  setView: (view: ModuleView) => void;
  setDemoDate: (date: string) => void;
  selectCase: (id: string | null) => void;
  setDrawerTab: (tab: string) => void;
  setSearch: (q: string) => void;
  setFilterStatus: (v: string) => void;
  setFilterPriority: (v: string) => void;

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
  moveCase: (id: string, stage: Stage, status: WorkflowStatus, event: string, note?: string) => void;
  recordFollowUp: (id: string, note: string, actor: string) => void;
  recordVisit: (id: string, note: string, actor: string) => void;
  recordPayment: (id: string, amount: number, mode: string, actor: string) => void;
  setNextFollowUp: (id: string, date: string, actor: string) => void;
  escalateCase: (id: string, reason: string, actor: string) => void;
  resolveCase: (id: string, note: string, actor: string) => void;
  assignCase: (id: string, officer: string, actor: string) => void;
  addNote: (id: string, text: string, actor: string) => void;
  raiseQuery: (id: string, question: string, actor: string) => void;
  toggleChecklist: (id: string, key: string, actor: string) => void;
}

let seq = 0;
const uid = (p: string) => `${p}-${Date.now()}-${seq++}`;

function stamp(demoDate: string): string {
  const now = new Date();
  return `${demoDate}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export const useAppStore = create<AppState>((set, get) => {
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
    currentRole: "Officer",
    currentView: "EMMS",
    currentDemoDate: dataProvider.getInitialDemoDate(),
    selectedCaseId: null,
    activeDrawerTab: "Overview",
    search: "",
    filterStatus: "all",
    filterPriority: "all",

    cases: dataProvider.getCases(),

    setRole: (currentRole) => set({ currentRole, selectedCaseId: null }),
    setView: (currentView) =>
      set({ currentView, selectedCaseId: null, search: "", filterStatus: "all" }),
    setDemoDate: (currentDemoDate) => set({ currentDemoDate }),
    selectCase: (selectedCaseId) => set({ selectedCaseId, activeDrawerTab: "Overview" }),
    setDrawerTab: (activeDrawerTab) => set({ activeDrawerTab }),
    setSearch: (search) => set({ search }),
    setFilterStatus: (filterStatus) => set({ filterStatus }),
    setFilterPriority: (filterPriority) => set({ filterPriority }),

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

    moveCase: (id, stage, status, event, note) =>
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
          disbursedDate: stage === "collections" ? get().currentDemoDate : c.disbursedDate,
          disbursedAmount: stage === "collections" ? c.loanAmount : c.disbursedAmount,
          collectionQueue: stage === "collections" ? "followup" : c.collectionQueue,
        }),
        { action: event, actor: get().currentRole, note },
      ),

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

    escalateCase: (id, reason, actor) =>
      patch(
        id,
        (c) => ({
          ...c,
          escalated: true,
          workflowStatus: c.stage === "collections" ? "ESCALATED" : c.workflowStatus,
          priority: "Critical",
        }),
        { action: "Case escalated", actor, note: reason },
      ),

    resolveCase: (id, note, actor) =>
      patch(
        id,
        (c) => ({
          ...c,
          workflowStatus: TRANSITIONS.resolve.status,
          escalated: false,
          collectionQueue: "none",
        }),
        { action: "Case resolved", actor, note },
      ),

    assignCase: (id, officer, actor) =>
      patch(id, (c) => ({ ...c, assignedOfficer: officer }), {
        action: "Case assigned",
        actor,
        note: `Owner set to ${officer}`,
      }),

    addNote: (id, text, actor) =>
      patch(
        id,
        (c) => ({
          ...c,
          notes: [...c.notes, { id: uid("n"), timestamp: stamp(get().currentDemoDate), actor, text }],
        }),
        { action: "Note added", actor, note: text },
      ),

    raiseQuery: (id, question, actor) =>
      patch(id, (c) => ({ ...c, queryRaised: true, workflowStatus: "In Review" }), {
        action: "Query raised",
        actor,
        note: question,
      }),

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
});

export const useCases = () => useAppStore((s) => s.cases);
export const useSelectedCase = () =>
  useAppStore((s) => s.cases.find((c) => c.id === s.selectedCaseId) ?? null);
