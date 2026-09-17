import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardCheck, MessageSquare, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { computeMetrics } from "@/utils/metrics";
import { getApplicationSla, isCaseSlaBreached } from "@/utils/dates";
import { getScope } from "@/utils/scope";
import { authorityFor, can } from "@/utils/permissions";
import { inr, pct } from "@/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPI, KPIGroup } from "@/components/kpi/KPI";
import { CardRow, KanbanBoard, KanbanCard, KanbanColumn } from "@/components/kanban/Kanban";
import { GlassPanel, SectionHeading } from "@/components/ui/GlassPanel";
import { EmptyState, FilterBar, SearchBar, SelectField } from "@/components/ui/Controls";
import { DataList } from "@/components/ui/DataList";
import { ExceptionBadge, PriorityBadge, QueryBadge, SlaBadge } from "@/components/ui/Badges";
import type { Stage } from "@/types/loan";

const CREDIT_STAGE_COLUMNS: { stage: Stage; label: string; accent: "review" | "success" }[] = [
  { stage: "application", label: "Applications Under Review", accent: "review" },
  { stage: "credit approved", label: "Credit Approved", accent: "success" },
];

export function CreditModule() {
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
  const canViewSla = can(currentRole, "viewSlaAttention");
  const metrics = computeMetrics(visible, currentDemoDate);

  const [queryOnly, setQueryOnly] = useState(false);
  const [cibilOnly, setCibilOnly] = useState(false);
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);

  useEffect(() => {
    fetchAllLoans();
  }, [fetchAllLoans]);

  // Credit queue covers cases in application and credit approved stages
  const credit = visible
    .filter((c) => c.stage === "application" || c.stage === "credit approved")
    .filter((c) => canViewSla || !isCaseSlaBreached(c, currentDemoDate));

  const slaCases = credit.filter((c) => isCaseSlaBreached(c, currentDemoDate));
  const exceptions = credit.filter((c) => c.cibilException);
  const queries = credit.filter((c) => c.queryRaised);

  const displayCredit = credit
    .filter((c) => !queryOnly || c.queryRaised)
    .filter((c) => !cibilOnly || c.cibilException)
    .filter((c) => !stageFilter || c.stage === stageFilter);

  const handleDropCase = async (caseId: string, targetStage: Stage) => {
    try {
      await updateLoanStageAction(caseId, targetStage);
      toast.success(`Case moved to ${targetStage}`);
    } catch (err) {
      toast.error("Failed to update case stage");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Credit"
        subtitle={
          canViewSla
            ? "Assessment queue, query loop, deviation authority and 15-day application SLA oversight"
            : "Assessment queue, query loop, and deviation authority"
        }
        crumbs={scope.crumbs}
      />

      <KPIGroup>
        <KPI
          label="In credit queue"
          value={credit.length}
          icon={<ClipboardCheck className="size-3.5" />}
          support={
            queryOnly || cibilOnly || stageFilter
              ? "Filter active (click to reset)"
              : "Awaiting decision"
          }
          isActive={!queryOnly && !cibilOnly && !stageFilter}
          clickHint="All"
          onClick={() => {
            setQueryOnly(false);
            setCibilOnly(false);
            setStageFilter(null);
            setSearch("");
            setFilterPriority("all");
            toast.info("Showing full credit queue");
          }}
        />
        <KPI
          label="Applications"
          value={credit.filter((c) => c.stage === "application").length}
          status="info"
          support={
            stageFilter === "application"
              ? "Filtered (click to clear)"
              : "Under review · Click to filter"
          }
          isActive={stageFilter === "application"}
          clickHint="Filter"
          onClick={() => {
            const next = stageFilter === "application" ? null : "application";
            setStageFilter(next);
            toast.info(next ? "Filtered to Applications" : "Showing all stages");
          }}
        />
        <KPI
          label="Open queries"
          value={queries.length}
          status="warning"
          icon={<MessageSquare className="size-3.5" />}
          support={
            queryOnly ? "Filter active · Click to clear" : "Waiting on sales · Click to open"
          }
          isActive={queryOnly}
          clickHint="View"
          onClick={() => {
            const willFilter = !queryOnly;
            setQueryOnly(willFilter);
            if (queries[0]) {
              selectCase(queries[0].id);
              setDrawerTab("Queries");
              toast.warning(`Redirected to open queries for ${queries[0].clientName}`);
            }
          }}
        />
        <KPI
          label="CIBIL exceptions"
          value={exceptions.length}
          status={exceptions.length ? "danger" : "neutral"}
          icon={<ShieldAlert className="size-3.5" />}
          support={cibilOnly ? "Filter active · Click to clear" : "Escalation to RM/MD"}
          isActive={cibilOnly}
          clickHint="Filter"
          onClick={() => {
            const willFilter = !cibilOnly;
            setCibilOnly(willFilter);
            toast.info(willFilter ? "Filtered to exceptions" : "Cleared exceptions filter");
          }}
        />
      </KPIGroup>

      <FilterBar
        active={
          Boolean(search) ||
          filterPriority !== "all" ||
          queryOnly ||
          cibilOnly ||
          stageFilter !== null
        }
        onReset={() => {
          setSearch("");
          setFilterPriority("all");
          setQueryOnly(false);
          setCibilOnly(false);
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
        {CREDIT_STAGE_COLUMNS.map((col) => {
          const list = displayCredit.filter((c) => c.stage === col.stage);

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
                const sla = getApplicationSla(c, currentDemoDate);
                const isBreached = isCaseSlaBreached(c, currentDemoDate);

                return (
                  <KanbanCard
                    key={c.id}
                    caseId={c.id}
                    onClick={() => selectCase(c.id)}
                    accent={
                      isBreached || sla?.urgency === "Critical"
                        ? "danger"
                        : c.cibilException
                          ? "review"
                          : "info"
                    }
                  >
                    <CardRow>
                      <span className="truncate text-sm font-semibold text-foreground">
                        {c.clientName}
                      </span>
                      {canViewSla && sla && (
                        <SlaBadge day={sla.day} total={sla.total} urgency={sla.urgency} />
                      )}
                    </CardRow>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {inr(c.loanAmount, true)} · CIBIL {c.credit.cibil} ·{" "}
                      {pct(c.terms.interestRate)}
                    </p>
                    <CardRow className="mt-2">
                      <span className="flex flex-wrap items-center gap-1">
                        {c.queryRaised && <QueryBadge />}
                        {c.cibilException && <ExceptionBadge />}
                        {isBreached && canViewSla && (
                          <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-destructive">
                            Overdue &gt;15d
                          </span>
                        )}
                      </span>
                      <PriorityBadge priority={c.priority} />
                    </CardRow>
                  </KanbanCard>
                );
              })}
            </KanbanColumn>
          );
        })}
      </KanbanBoard>

      <div className={canViewSla ? "grid gap-4 lg:grid-cols-2" : "grid gap-4 lg:grid-cols-1"}>
        {canViewSla && (
          <GlassPanel accent="danger">
            <SectionHeading
              title="SLA attention"
              count={slaCases.length}
              icon={<AlertTriangle className="size-4 text-destructive" />}
            />
            <DataList
              items={slaCases.map((c) => {
                const sla = getApplicationSla(c, currentDemoDate)!;
                return {
                  id: c.id,
                  primary: c.clientName,
                  secondary: `Day ${sla.day} of ${sla.total} · Breached Application SLA`,
                  meta: <SlaBadge day={sla.day} total={sla.total} urgency={sla.urgency} />,
                  accent: "danger" as const,
                };
              })}
              onSelect={selectCase}
              empty={<EmptyState compact title="Every application is inside SLA" />}
            />
          </GlassPanel>
        )}
        <GlassPanel accent="review">
          <SectionHeading title="Exceptions & deviation authority" count={exceptions.length} />
          <DataList
            items={exceptions.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: `CIBIL ${c.credit.cibil} · ${c.credit.riskLevel} risk · sign-off: ${authorityFor(1)}`,
              meta: <ExceptionBadge />,
              accent: "review" as const,
            }))}
            onSelect={selectCase}
            empty={<EmptyState compact title="No exceptions pending" />}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
