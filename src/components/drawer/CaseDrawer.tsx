import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  Circle,
  CreditCard,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { can, type Action } from "@/utils/permissions";
import { getApplicationSla, getCollectionState } from "@/utils/dates";
import { TRANSITIONS, nextEmmsStatus } from "@/utils/transitions";
import { inr, longDate, pct, shortDate } from "@/utils/format";
import type { LoanCase } from "@/types/loan";
import {
  BouncedBadge,
  ExceptionBadge,
  PriorityBadge,
  QueryBadge,
  SlaBadge,
  StatusBadge,
  TemperatureBadge,
} from "@/components/ui/Badges";
import {
  ActionButton,
  ConfirmationModal,
  EmptyState,
  TextArea,
  TextField,
} from "@/components/ui/Controls";
import { KeyValue, Timeline } from "@/components/ui/DataList";

type ModalKind =
  | "followup"
  | "visit"
  | "payment"
  | "nextFollowUp"
  | "escalate"
  | "note"
  | "query"
  | "approve"
  | "reject"
  | "disburse"
  | "markReady"
  | "resolve"
  | "assign"
  | "convert"
  | null;

const OFFICERS = ["Arnav", "Jatin", "Tarun", "Shoaib"];

function tabsFor(c: LoanCase): string[] {
  switch (c.stage) {
    case "enquiry":
      return ["Overview", "Loan Details", "Documents", "History"];
    case "credit_review":
      return ["Overview", "Loan Details", "Documents", "Credit", "Financials", "History"];
    case "disbursement":
      return ["Overview", "Loan Details", "Documents", "Verification", "Disbursement", "History"];
    default:
      return ["Overview", "Loan Details", "Payments", "Credit", "History"];
  }
}

export function CaseDrawer() {
  const {
    cases,
    selectedCaseId,
    selectCase,
    activeDrawerTab,
    setDrawerTab,
    currentRole,
    currentDemoDate,
    moveCase,
    recordFollowUp,
    recordVisit,
    recordPayment,
    setNextFollowUp,
    escalateCase,
    resolveCase,
    assignCase,
    addNote,
    raiseQuery,
    toggleChecklist,
  } = useAppStore();

  const c = cases.find((x) => x.id === selectedCaseId) ?? null;
  const [modal, setModal] = useState<ModalKind>(null);
  const [text, setText] = useState("");
  const [date, setDate] = useState(currentDemoDate);
  const [officer, setOfficer] = useState(OFFICERS[0]!);

  useEffect(() => {
    if (!selectedCaseId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") selectCase(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCaseId, selectCase]);

  const tabs = useMemo(() => (c ? tabsFor(c) : []), [c]);
  const open = Boolean(c);

  const closeModal = useCallback(() => {
    setModal(null);
    setText("");
  }, []);

  const allow = (a: Action) => (c ? can(currentRole, a, c) : false);

  const runAction = () => {
    if (!c) return;
    switch (modal) {
      case "convert":
        moveCase(
          c.id,
          TRANSITIONS.convertToApplication.stage,
          TRANSITIONS.convertToApplication.status,
          TRANSITIONS.convertToApplication.event,
          "Converted from enquiry, routed to credit review",
        );
        toast.success("Converted to application", { description: "Case is now in credit review" });
        break;
      case "approve":
        moveCase(
          c.id,
          TRANSITIONS.approve.stage,
          TRANSITIONS.approve.status,
          TRANSITIONS.approve.event,
          text || undefined,
        );
        toast.success("Credit approved", { description: "Case handed over to Operations" });
        break;
      case "reject":
        moveCase(
          c.id,
          TRANSITIONS.reject.stage,
          TRANSITIONS.reject.status,
          TRANSITIONS.reject.event,
          text,
        );
        toast.error("Application rejected");
        break;
      case "query":
        raiseQuery(c.id, text, currentRole);
        toast.message("Query raised", { description: "Sales notified for clarification" });
        break;
      case "markReady":
        moveCase(
          c.id,
          TRANSITIONS.markReady.stage,
          TRANSITIONS.markReady.status,
          TRANSITIONS.markReady.event,
        );
        toast.success("Marked ready for disbursement");
        break;
      case "disburse":
        moveCase(
          c.id,
          TRANSITIONS.disburse.stage,
          TRANSITIONS.disburse.status,
          TRANSITIONS.disburse.event,
          `${inr(c.loanAmount)} released to ${c.terms.bankAccount}`,
        );
        toast.success("Funds disbursed", {
          description: "Loan is active and in the collection cycle",
        });
        break;
      case "followup":
        recordFollowUp(c.id, text, currentRole);
        toast.success("Follow-up recorded");
        break;
      case "visit":
        recordVisit(c.id, text, currentRole);
        toast.success("Field visit recorded");
        break;
      case "payment":
        recordPayment(c.id, c.emiAmount, "NACH", currentRole);
        toast.success("Payment recorded", { description: `${inr(c.emiAmount)} received` });
        break;
      case "nextFollowUp":
        setNextFollowUp(c.id, date, currentRole);
        toast.success("Next follow-up set", { description: longDate(date) });
        break;
      case "escalate":
        escalateCase(c.id, text, currentRole);
        toast.error("Case escalated");
        break;
      case "resolve":
        resolveCase(c.id, text, currentRole);
        toast.success("Case resolved");
        break;
      case "assign":
        assignCase(c.id, officer, currentRole);
        toast.success(`Assigned to ${officer}`);
        break;
      case "note":
        addNote(c.id, text, currentRole);
        toast.success("Note added");
        break;
      default:
        break;
    }
    closeModal();
  };

  const collection = c && c.stage === "collections" ? getCollectionState(c, currentDemoDate) : null;
  const sla = c ? getApplicationSla(c, currentDemoDate) : null;

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={() => selectCase(null)}
        className={cn(
          "fixed inset-0 z-50 bg-background/70 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Case detail"
        className={cn(
          "fixed right-0 top-0 z-60 flex h-screen w-full flex-col border-l border-border-strong bg-surface shadow-drawer transition-transform duration-300 ease-out sm:w-[460px] xl:w-[560px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {c && (
          <>
            <header className="border-b border-border px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="num text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {c.id}
                  </p>
                  <h2 className="truncate text-lg font-bold tracking-tight text-foreground">
                    {c.clientName}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" aria-hidden />
                    {c.branch} · {c.area} · {c.region} · {c.assignedOfficer}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => selectCase(null)}
                  aria-label="Close case detail"
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <StatusBadge
                  status={collection ? collection.status : c.workflowStatus}
                  urgency={collection?.urgency}
                />
                <PriorityBadge priority={c.priority} />
                {c.stage === "enquiry" && <TemperatureBadge temperature={c.temperature} />}
                {c.queryRaised && <QueryBadge />}
                {c.cibilException && <ExceptionBadge />}
                {collection?.hasBounced && <BouncedBadge />}
                {sla && <SlaBadge day={sla.day} total={sla.total} urgency={sla.urgency} />}
              </div>
            </header>

            <nav
              aria-label="Case sections"
              className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2"
            >
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDrawerTab(t)}
                  aria-current={activeDrawerTab === t ? "true" : undefined}
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200",
                    activeDrawerTab === t
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <DrawerBody
                c={c}
                tab={tabs.includes(activeDrawerTab) ? activeDrawerTab : "Overview"}
                demoDate={currentDemoDate}
                onToggleChecklist={(key) => toggleChecklist(c.id, key, currentRole)}
                canVerify={allow("verify")}
                onAddNote={(noteText) => addNote(c.id, noteText, currentRole)}
                canAddNote={allow("addNote")}
              />
            </div>

            <footer className="flex flex-wrap gap-2 border-t border-border bg-card/60 px-5 py-3">
              {c.stage === "enquiry" && (
                <>
                  {allow("convertToApplication") && (
                    <ActionButton variant="primary" size="sm" onClick={() => setModal("convert")}>
                      Convert to Application
                    </ActionButton>
                  )}
                  {nextEmmsStatus(c.workflowStatus) && (
                    <ActionButton
                      size="sm"
                      onClick={() => {
                        const next = nextEmmsStatus(c.workflowStatus)!;
                        moveCase(
                          c.id,
                          "enquiry",
                          next,
                          `Moved to ${next}`,
                          `Pipeline stage advanced to ${next}`,
                        );
                        toast.success(`Moved to ${next}`);
                      }}
                    >
                      Advance to {nextEmmsStatus(c.workflowStatus)}
                    </ActionButton>
                  )}
                  {allow("recordFollowUp") && (
                    <ActionButton size="sm" onClick={() => setModal("followup")}>
                      Record Follow-up
                    </ActionButton>
                  )}
                  {allow("setNextFollowUp") && (
                    <ActionButton size="sm" onClick={() => setModal("nextFollowUp")}>
                      Set Next Follow-up
                    </ActionButton>
                  )}
                </>
              )}

              {c.stage === "credit_review" && (
                <>
                  {allow("approve") && (
                    <ActionButton variant="primary" size="sm" onClick={() => setModal("approve")}>
                      Approve
                    </ActionButton>
                  )}
                  {allow("query") && (
                    <ActionButton size="sm" onClick={() => setModal("query")}>
                      Raise Query
                    </ActionButton>
                  )}
                  {allow("reject") && (
                    <ActionButton variant="danger" size="sm" onClick={() => setModal("reject")}>
                      Reject
                    </ActionButton>
                  )}
                </>
              )}

              {c.stage === "disbursement" && (
                <>
                  {c.workflowStatus === "Verification" && allow("markReady") && (
                    <ActionButton variant="primary" size="sm" onClick={() => setModal("markReady")}>
                      Mark Ready
                    </ActionButton>
                  )}
                  {allow("processDisbursement") && (
                    <ActionButton variant="success" size="sm" onClick={() => setModal("disburse")}>
                      Disburse Funds
                    </ActionButton>
                  )}
                  {allow("query") && (
                    <ActionButton size="sm" onClick={() => setModal("query")}>
                      Raise Query
                    </ActionButton>
                  )}
                </>
              )}

              {c.stage === "collections" && (
                <>
                  {allow("recordPayment") && (
                    <ActionButton variant="primary" size="sm" onClick={() => setModal("payment")}>
                      Record Payment
                    </ActionButton>
                  )}
                  {allow("recordFollowUp") && (
                    <ActionButton size="sm" onClick={() => setModal("followup")}>
                      Record Follow-up
                    </ActionButton>
                  )}
                  {allow("recordVisit") && (
                    <ActionButton size="sm" onClick={() => setModal("visit")}>
                      Record Visit
                    </ActionButton>
                  )}
                  {allow("setNextFollowUp") && (
                    <ActionButton size="sm" onClick={() => setModal("nextFollowUp")}>
                      Next Follow-up
                    </ActionButton>
                  )}
                  {allow("resolve") && (
                    <ActionButton variant="success" size="sm" onClick={() => setModal("resolve")}>
                      Resolve
                    </ActionButton>
                  )}
                </>
              )}

              {allow("assign") && (
                <ActionButton size="sm" onClick={() => setModal("assign")}>
                  Assign / Reassign
                </ActionButton>
              )}
              {allow("addNote") && (
                <ActionButton variant="ghost" size="sm" onClick={() => setModal("note")}>
                  Add Note
                </ActionButton>
              )}
              {allow("escalate") && (
                <ActionButton variant="danger" size="sm" onClick={() => setModal("escalate")}>
                  Escalate
                </ActionButton>
              )}
            </footer>
          </>
        )}
      </aside>

      {c && (
        <ConfirmationModal
          open={modal !== null}
          title={modalTitle(modal)}
          description={modalDescription(modal, c)}
          confirmLabel={modalConfirm(modal)}
          variant={
            modal === "reject" || modal === "escalate"
              ? "danger"
              : modal === "disburse" || modal === "resolve"
                ? "success"
                : "primary"
          }
          details={
            modal === "disburse"
              ? [
                  { label: "Loan amount", value: inr(c.loanAmount) },
                  { label: "Approved rate", value: pct(c.terms.interestRate) },
                  { label: "Borrower", value: c.clientName },
                  { label: "Bank account", value: c.terms.bankAccount },
                  {
                    label: "Verification",
                    value: `${c.checklist.filter((i) => i.done).length}/${c.checklist.length} complete`,
                  },
                ]
              : modal === "payment"
                ? [
                    { label: "EMI amount", value: inr(c.emiAmount) },
                    { label: "Outstanding", value: inr(c.outstanding) },
                    { label: "Value date", value: longDate(currentDemoDate) },
                  ]
                : undefined
          }
          onCancel={closeModal}
          onConfirm={runAction}
        >
          <div className="mt-4 space-y-3">
            {modal === "nextFollowUp" && (
              <TextField label="Next follow-up date" type="date" value={date} onChange={setDate} />
            )}
            {modal === "assign" && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Officer
                </span>
                <select
                  value={officer}
                  onChange={(e) => setOfficer(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface/70 px-3 py-2 text-sm text-foreground focus:outline-none"
                >
                  {OFFICERS.map((o) => (
                    <option key={o} value={o} className="bg-popover">
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {modal !== null && modal !== "nextFollowUp" && modal !== "assign" && (
              <TextArea
                label={modal === "query" ? "Query" : "Remarks"}
                value={text}
                onChange={setText}
                placeholder="Add context for the audit trail"
              />
            )}
          </div>
        </ConfirmationModal>
      )}
    </>
  );
}

function modalTitle(kind: ModalKind): string {
  const map: Record<string, string> = {
    convert: "Convert enquiry to application?",
    approve: "Approve credit?",
    reject: "Reject application?",
    query: "Raise a query",
    markReady: "Mark ready for disbursement?",
    disburse: "Confirm disbursement",
    followup: "Record follow-up",
    visit: "Record field visit",
    payment: "Record payment",
    nextFollowUp: "Set next follow-up",
    escalate: "Escalate case?",
    resolve: "Resolve case?",
    assign: "Assign case",
    note: "Add note",
  };
  return kind ? (map[kind] ?? "Confirm") : "Confirm";
}

function modalDescription(kind: ModalKind, c: LoanCase): string | undefined {
  switch (kind) {
    case "convert":
      return "The enquiry becomes an application and enters the credit review queue.";
    case "approve":
      return "Approval is a gate: the case moves to Operations for verification and disbursement.";
    case "reject":
      return "This closes the application. The decision is recorded in case history.";
    case "escalate":
      return "Escalation routes the case to the next authority level.";
    case "resolve":
      return `${c.clientName} will be marked resolved for the current cycle.`;
    default:
      return undefined;
  }
}

function modalConfirm(kind: ModalKind): string {
  const map: Record<string, string> = {
    convert: "Convert",
    approve: "Approve",
    reject: "Reject",
    query: "Raise query",
    markReady: "Mark ready",
    disburse: "Disburse funds",
    followup: "Save follow-up",
    visit: "Save visit",
    payment: "Record payment",
    nextFollowUp: "Save date",
    escalate: "Escalate",
    resolve: "Resolve",
    assign: "Assign",
    note: "Save note",
  };
  return kind ? (map[kind] ?? "Confirm") : "Confirm";
}

/* ------------------------------- Drawer body ------------------------------- */

function DrawerBody({
  c,
  tab,
  demoDate,
  onToggleChecklist,
  canVerify,
  onAddNote,
  canAddNote,
}: {
  c: LoanCase;
  tab: string;
  demoDate: string;
  onToggleChecklist: (key: string) => void;
  canVerify: boolean;
  onAddNote?: ((text: string) => void) | undefined;
  canAddNote?: boolean | undefined;
}) {
  const collection = c.stage === "collections" ? getCollectionState(c, demoDate) : null;

  if (tab === "Overview")
    return (
      <div className="space-y-5">
        <Block title="Applicant / Entity" icon={<Building2 className="size-3.5" />}>
          <KeyValue
            rows={[
              { label: "Entity type", value: c.applicant.entityType },
              { label: "Purpose", value: c.applicant.purpose },
              {
                label: "Contact",
                value: (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3 text-muted-foreground" aria-hidden />
                    {c.applicant.contact}
                  </span>
                ),
              },
              { label: "Email", value: c.applicant.email },
              { label: "Business location", value: c.applicant.business },
              { label: "Owner", value: c.assignedOfficer },
            ]}
          />
        </Block>
        <Block title="Position" icon={<Wallet className="size-3.5" />}>
          <KeyValue
            rows={[
              { label: "Loan amount", value: inr(c.loanAmount) },
              { label: "EMI", value: inr(c.emiAmount) },
              { label: "Outstanding", value: inr(c.outstanding) },
              { label: "Follow-ups", value: c.followUpCount },
              { label: "Last follow-up", value: shortDate(c.lastFollowUp) },
              { label: "Next follow-up", value: shortDate(c.nextFollowUp) },
            ]}
          />
        </Block>
        {collection && (
          <Block title="Collection condition" icon={<AlertTriangle className="size-3.5" />}>
            <KeyValue
              rows={[
                { label: "Status", value: collection.status },
                { label: "Signal", value: collection.label },
                { label: "Due window", value: collection.dueWindow },
                { label: "Overdue days", value: collection.overdueDays },
              ]}
            />
            {collection.hasBounced && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-warning/25 bg-warning/10 px-2.5 py-2 text-xs font-medium text-warning">
                <AlertTriangle className="size-3.5" aria-hidden />
                Previous payment bounced — verify mandate before the next cycle.
              </p>
            )}
          </Block>
        )}
        {c.notes.length > 0 && (
          <Block title="Notes">
            <ul className="space-y-2">
              {c.notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-border bg-surface/50 px-3 py-2">
                  <p className="text-sm text-foreground">{n.text}</p>
                  <p className="num mt-0.5 text-[11px] text-muted-foreground">
                    {n.actor} · {n.timestamp.replace("T", " · ")}
                  </p>
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>
    );

  if (tab === "Loan Details")
    return (
      <div className="space-y-5">
        <Block title="Loan structure" icon={<CreditCard className="size-3.5" />}>
          <KeyValue
            rows={[
              { label: "Product", value: c.terms.product },
              { label: "Amount", value: inr(c.loanAmount) },
              { label: "Tenure", value: `${c.terms.tenureMonths} months` },
              { label: "Rate", value: pct(c.terms.interestRate) },
              { label: "EMI", value: inr(c.emiAmount) },
              { label: "Repayment", value: c.terms.repayment },
            ]}
          />
        </Block>
        {c.exceptions.length > 0 && (
          <Block title="Approvals & exceptions">
            <ul className="space-y-2">
              {c.exceptions.map((e) => (
                <li key={e.id} className="rounded-lg border border-review/25 bg-review/8 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{e.type}</p>
                    <StatusBadge status={e.decision} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {e.authority} · {e.reason}
                  </p>
                  <p className="num text-[11px] text-muted-foreground/70">
                    {e.timestamp.replace("T", " · ")}
                  </p>
                </li>
              ))}
            </ul>
          </Block>
        )}
        <LoanDetailsNotesSection c={c} onAddNote={onAddNote} canAddNote={canAddNote} />
      </div>
    );

  if (tab === "Documents")
    return (
      <Block title="Document checklist">
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {c.documents.map((d) => (
            <li
              key={d.name}
              className="flex items-center justify-between gap-3 bg-surface/40 px-3 py-2.5"
            >
              <span className="text-sm text-foreground">{d.name}</span>
              {d.received ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle2 className="size-3.5" aria-hidden /> Received
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                  <XCircle className="size-3.5" aria-hidden /> Pending
                </span>
              )}
            </li>
          ))}
        </ul>
      </Block>
    );

  if (tab === "Credit")
    return (
      <div className="space-y-5">
        <Block title="Bureau & obligations">
          <KeyValue
            rows={[
              { label: "CIBIL score", value: c.credit.cibil },
              { label: "Existing loans", value: c.credit.existingLoans },
              { label: "Existing obligations", value: inr(c.credit.existingObligations) },
              { label: "Defaults / bounces", value: c.credit.defaults },
              { label: "Overdue amount", value: inr(c.credit.overdueAmount) },
              { label: "Risk level", value: c.credit.riskLevel },
            ]}
          />
        </Block>
        <Block title="Assessment">
          <p className="text-sm text-foreground">{c.credit.recommendation}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Repayment capacity {c.financials.repaymentCapacity}% of EMI from net cash flow.
          </p>
        </Block>
        {c.emiHistory.length > 0 && <EmiHistory c={c} />}
      </div>
    );

  if (tab === "Financials")
    return (
      <Block title="Financial summary" icon={<Banknote className="size-3.5" />}>
        <KeyValue
          rows={[
            { label: "Annual revenue", value: inr(c.financials.annualRevenue, true) },
            { label: "Net monthly cash flow", value: inr(c.financials.netCashFlow) },
            { label: "Existing obligations", value: inr(c.financials.existingObligations) },
            { label: "Repayment capacity", value: `${c.financials.repaymentCapacity}%` },
          ]}
        />
      </Block>
    );

  if (tab === "Verification")
    return (
      <Block title="Verification checklist">
        <ul className="space-y-2">
          {c.checklist.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                disabled={!canVerify}
                onClick={() => onToggleChecklist(item.key)}
                aria-pressed={item.done}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors duration-200",
                  item.done
                    ? "border-success/30 bg-success/10 text-foreground"
                    : "border-border bg-surface/40 text-muted-foreground hover:bg-accent/60",
                  !canVerify && "cursor-not-allowed opacity-70",
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="size-4 text-success" aria-hidden />
                ) : (
                  <Circle className="size-4" aria-hidden />
                )}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </Block>
    );

  if (tab === "Disbursement")
    return (
      <Block title="Disbursement readiness" icon={<Banknote className="size-3.5" />}>
        <KeyValue
          rows={[
            { label: "Amount", value: inr(c.loanAmount) },
            { label: "Bank account", value: c.terms.bankAccount },
            { label: "Approved rate", value: pct(c.terms.interestRate) },
            {
              label: "Checks complete",
              value: `${c.checklist.filter((i) => i.done).length}/${c.checklist.length}`,
            },
            {
              label: "Disbursed on",
              value: c.disbursedDate ? longDate(c.disbursedDate) : "Pending",
            },
          ]}
        />
      </Block>
    );

  if (tab === "Payments")
    return (
      <div className="space-y-5">
        <EmiHistory c={c} />
        <Block title="Payments recorded">
          {c.payments.length === 0 ? (
            <EmptyState compact title="No payments recorded yet" />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {c.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between bg-surface/40 px-3 py-2.5"
                >
                  <span className="text-sm text-foreground">{longDate(p.date)}</span>
                  <span className="num text-sm font-semibold text-foreground">
                    {inr(p.amount)} · {p.mode}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Block>
        {c.visits.length > 0 && (
          <Block title="Field visits">
            <ul className="space-y-2">
              {c.visits.map((v) => (
                <li key={v.id} className="rounded-lg border border-border bg-surface/50 px-3 py-2">
                  <p className="num text-xs text-muted-foreground">{longDate(v.date)}</p>
                  <p className="text-sm text-foreground">{v.note || "Visit completed"}</p>
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>
    );

  return (
    <Block title="Audit trail">
      <Timeline events={c.history} />
    </Block>
  );
}

function EmiHistory({ c }: { c: LoanCase }) {
  return (
    <Block title="EMI history">
      {c.emiHistory.length === 0 ? (
        <EmptyState compact title="No EMI cycles yet" />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {c.emiHistory.map((e) => (
            <li
              key={e.cycleMonth}
              className="flex items-center justify-between gap-3 bg-surface/40 px-3 py-2.5"
            >
              <span className="num text-sm text-foreground">{e.cycleMonth}</span>
              <span className="flex items-center gap-2">
                {e.bounced && <BouncedBadge />}
                <span
                  className={cn(
                    "num text-xs font-semibold",
                    e.paidDate ? "text-success" : "text-warning",
                  )}
                >
                  {e.paidDate ? `Paid ${shortDate(e.paidDate)}` : "Unpaid"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

function Block({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode | undefined;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function LoanDetailsNotesSection({
  c,
  onAddNote,
  canAddNote,
}: {
  c: LoanCase;
  onAddNote?: ((text: string) => void) | undefined;
  canAddNote?: boolean | undefined;
}) {
  const [inputNote, setInputNote] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNote.trim() || !onAddNote) return;
    onAddNote(inputNote.trim());
    setInputNote("");
    toast.success("Note added to loan file");
  };

  const allRemarks = useMemo(() => {
    const list: {
      id: string;
      text: string;
      actor: string;
      timestamp: string;
      action: string;
    }[] = [];
    const seen = new Set<string>();

    for (const n of c.notes) {
      const key = `${n.timestamp}-${n.text.trim()}`;
      seen.add(key);
      list.push({
        id: n.id,
        text: n.text,
        actor: n.actor,
        timestamp: n.timestamp,
        action: "Note",
      });
    }

    for (const h of c.history) {
      if (!h.note || !h.note.trim()) continue;
      const key = `${h.timestamp}-${h.note.trim()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({
        id: h.id,
        text: h.note,
        actor: h.actor,
        timestamp: h.timestamp,
        action: h.action || "Review Remark",
      });
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [c.notes, c.history]);

  return (
    <Block title="Notes & Review Remarks" icon={<MessageSquare className="size-3.5" />}>
      {canAddNote && (
        <form onSubmit={handleAdd} className="mb-3 space-y-2">
          <div className="relative">
            <textarea
              value={inputNote}
              onChange={(e) => setInputNote(e.target.value)}
              placeholder="Write a note or review remark for this loan case..."
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-surface/60 p-2.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!inputNote.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="size-3" />
              Add Remark
            </button>
          </div>
        </form>
      )}

      {allRemarks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-4 text-center">
          <p className="text-xs text-muted-foreground italic">
            No notes or review remarks logged yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {allRemarks.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border/80 bg-surface/50 p-2.5 shadow-xs transition-all hover:bg-surface-raised"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground">
                    {item.actor}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    • {item.action}
                  </span>
                </div>
                <span className="num text-[10px] font-medium text-muted-foreground/80">
                  {item.timestamp.replace("T", " ")}
                </span>
              </div>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {item.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}
