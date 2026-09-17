import { useEffect, useState } from "react";
import { AlertOctagon, CalendarClock, CheckCircle2, IndianRupee, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { collectionBuckets } from "@/utils/metrics";
import { getCollectionState } from "@/utils/dates";
import { getScope } from "@/utils/scope";
import { inr, longDate, shortDate } from "@/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPI, KPIGroup } from "@/components/kpi/KPI";
import { CardRow, KanbanBoard, KanbanCard, KanbanColumn } from "@/components/kanban/Kanban";
import { GlassPanel, SectionHeading } from "@/components/ui/GlassPanel";
import { EmptyState, FilterBar, SearchBar, SelectField } from "@/components/ui/Controls";
import { DataList } from "@/components/ui/DataList";
import { BouncedBadge, PriorityBadge, StatusBadge } from "@/components/ui/Badges";
import type { CollectionUrgency, Stage } from "@/types/loan";

const urgencyAccent: Record<CollectionUrgency, "success" | "warning" | "danger"> = {
  healthy: "success",
  due: "warning",
  overdue: "danger",
  resolved: "success",
};

const COLLECTIONS_STAGE_COLUMNS: {
  stage: Stage;
  label: string;
  accent: "warning" | "danger" | "success" | "info";
}[] = [
  { stage: "disbursed", label: "Disbursed (Pending Activation)", accent: "info" },
  { stage: "active loan", label: "Active Loans", accent: "warning" },
  { stage: "recovered", label: "Recovered / Closed", accent: "success" },
];

export function CollectionsModule() {
  const {
    currentRole,
    currentDemoDate,
    search,
    setSearch,
    filterPriority,
    setFilterPriority,
    selectCase,
    setDrawerTab,
    fetchAllLoans,
    updateLoanStageAction,
  } = useAppStore();

  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const buckets = collectionBuckets(visible, currentDemoDate);

  const [stageFilter, setStageFilter] = useState<Stage | null>(null);

  useEffect(() => {
    fetchAllLoans();
  }, [fetchAllLoans]);

  // Collections queue covers disbursed, active loan, and recovered stages
  const collectionsCases = visible.filter(
    (c) => c.stage === "disbursed" || c.stage === "active loan" || c.stage === "recovered",
  );

  const active = visible.filter((c) => c.stage === "active loan" || c.stage === "disbursed");
  const overdueAmount = buckets.overdue.reduce((a, c) => a + c.emiAmount, 0);
  const collected = active.reduce(
    (a, c) =>
      a +
      c.payments
        .filter((p) => p.date.slice(0, 7) === currentDemoDate.slice(0, 7))
        .reduce((x, p) => x + p.amount, 0),
    0,
  );

  const handleDropCase = async (caseId: string, targetStage: Stage) => {
    try {
      await updateLoanStageAction(caseId, targetStage);
      toast.success(`Case updated to ${targetStage}`);
    } catch (err) {
      toast.error("Failed to update case stage");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Collections"
        subtitle={`Repayment condition as on ${longDate(currentDemoDate)} — select system date to inspect cycle`}
        crumbs={scope.crumbs}
      />

      <KPIGroup>
        <KPI
          label="Active book"
          value={active.length}
          icon={<IndianRupee className="size-3.5" />}
          support={
            stageFilter ? `Filtered: ${stageFilter} · Click to reset` : "Receivable accounts"
          }
          isActive={stageFilter === null}
          clickHint="All"
          onClick={() => {
            setStageFilter(null);
            setSearch("");
            setFilterPriority("all");
            toast.info("Showing all collection stages");
          }}
        />
        <KPI
          label="Overdue balance"
          value={inr(overdueAmount, true)}
          status={overdueAmount ? "danger" : "success"}
          icon={<TrendingDown className="size-3.5" />}
          support={`${buckets.overdue.length} delinquent accounts`}
        />
        <KPI
          label="Escalated"
          value={buckets.escalated.length}
          status={buckets.escalated.length ? "danger" : "neutral"}
          icon={<AlertOctagon className="size-3.5" />}
          support="Legal / senior intervention"
        />
        <KPI
          label="Collected this month"
          value={inr(collected, true)}
          status="success"
          icon={<CheckCircle2 className="size-3.5" />}
          support={`${collectionsCases.filter((c) => c.stage === "recovered").length} recovered`}
        />
      </KPIGroup>

      <FilterBar
        active={search !== "" || filterPriority !== "all" || stageFilter !== null}
        onReset={() => {
          setSearch("");
          setFilterPriority("all");
          setStageFilter(null);
        }}
      >
        <SearchBar value={search} onChange={setSearch} />
        <SelectField
          label="Priority"
          value={filterPriority}
          onChange={setFilterPriority}
          options={[
            { value: "all", label: "All priorities" },
            { value: "Critical", label: "Critical" },
            { value: "High", label: "High" },
            { value: "Medium", label: "Medium" },
            { value: "Low", label: "Low" },
          ]}
        />
      </FilterBar>

      {/* Kanban Board mapped strictly to LoanStage ENUMs */}
      <KanbanBoard>
        {COLLECTIONS_STAGE_COLUMNS.filter((col) => !stageFilter || col.stage === stageFilter).map(
          (col) => {
            const list = collectionsCases.filter((c) => c.stage === col.stage);

            return (
              <KanbanColumn
                key={col.stage}
                title={col.label}
                count={list.length}
                accent={col.accent}
                emptyLabel={`No cases in ${col.label.toLowerCase()}`}
                onDropCase={(caseId) => handleDropCase(caseId, col.stage)}
              >
                {list.map((c) => {
                  const s = getCollectionState(c, currentDemoDate);
                  return (
                    <KanbanCard
                      key={c.id}
                      caseId={c.id}
                      onClick={() => selectCase(c.id)}
                      accent={urgencyAccent[s.urgency]}
                    >
                      <CardRow>
                        <span className="truncate text-sm font-semibold text-foreground">
                          {c.clientName}
                        </span>
                        <StatusBadge status={s.status} urgency={s.urgency} />
                      </CardRow>
                      <p className="num mt-1 text-xs text-muted-foreground">
                        EMI {inr(c.emiAmount)} · {s.dueWindow}
                      </p>
                      <CardRow className="mt-2">
                        <span className="num text-[11px] font-medium text-muted-foreground">
                          {s.label}
                        </span>
                        <span className="flex items-center gap-1">
                          {s.hasBounced && <BouncedBadge />}
                          <PriorityBadge priority={c.priority} />
                        </span>
                      </CardRow>
                      <p className="num mt-1.5 text-[11px] text-muted-foreground/80">
                        {c.assignedOfficer} · next follow-up {shortDate(c.nextFollowUp)}
                      </p>
                    </KanbanCard>
                  );
                })}
              </KanbanColumn>
            );
          },
        )}
      </KanbanBoard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel accent="warning">
          <SectionHeading title="Bounced payment history" count={buckets.bounced.length} />
          <DataList
            items={buckets.bounced.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: `EMI ${inr(c.emiAmount)} · ${c.branch} · assigned to ${c.assignedOfficer}`,
              meta: <BouncedBadge />,
              accent: "danger" as const,
            }))}
            onSelect={(id) => {
              selectCase(id);
              setDrawerTab("Payments");
            }}
            empty={<EmptyState compact title="Zero bounces recorded" />}
          />
        </GlassPanel>

        <GlassPanel accent="danger">
          <SectionHeading
            title="Overdue accounts requiring contact"
            count={buckets.overdue.length}
          />
          <DataList
            items={buckets.overdue.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: `Outstanding: ${inr(c.outstanding, true)} · ${c.applicant.contact}`,
              meta: <PriorityBadge priority={c.priority} />,
              accent: "danger" as const,
            }))}
            onSelect={(id) => {
              selectCase(id);
              setDrawerTab("Overview");
            }}
            empty={<EmptyState compact title="No overdue accounts" />}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
