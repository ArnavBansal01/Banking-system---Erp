import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { computeMetrics } from "@/utils/metrics";
import { getApplicationSla, isCaseSlaBreached } from "@/utils/dates";
import { COLUMN_LABELS, CREDIT_COLUMNS } from "@/utils/transitions";
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
  } = useAppStore();
  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const canViewSla = can(currentRole, "viewSlaAttention");
  const metrics = computeMetrics(visible, currentDemoDate);

  const [queryOnly, setQueryOnly] = useState(false);
  const [cibilOnly, setCibilOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // If role is Branch Manager or Officer, hide all breached SLA cases from Credit view
  const credit = visible
    .filter((c) => c.stage === "credit_review")
    .filter((c) => canViewSla || !isCaseSlaBreached(c, currentDemoDate));

  const slaCases = credit.filter((c) => isCaseSlaBreached(c, currentDemoDate));
  const readyCount = credit.filter((c) => c.workflowStatus === "Ready").length;
  const exceptions = credit.filter((c) => c.cibilException);
  const queries = credit.filter((c) => c.queryRaised);

  const displayCredit = credit
    .filter((c) => !queryOnly || c.queryRaised)
    .filter((c) => !cibilOnly || c.cibilException)
    .filter((c) => !statusFilter || c.workflowStatus === statusFilter);

  const availableColumns = CREDIT_COLUMNS.filter((col) => col !== "SLA Attention" || canViewSla);

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
            queryOnly || cibilOnly || statusFilter
              ? "Filter active (click to reset)"
              : "Awaiting decision"
          }
          isActive={!queryOnly && !cibilOnly && !statusFilter}
          clickHint="All"
          onClick={() => {
            setQueryOnly(false);
            setCibilOnly(false);
            setStatusFilter(null);
            setSearch("");
            setFilterPriority("all");
            toast.info("Showing full credit queue");
          }}
        />
        <KPI
          label="Under review"
          value={metrics.underReview}
          status="info"
          support={
            statusFilter === "In Review"
              ? "Filtered (click to clear)"
              : "Being assessed · Click to filter"
          }
          isActive={statusFilter === "In Review"}
          clickHint="Filter"
          onClick={() => {
            const next = statusFilter === "In Review" ? null : "In Review";
            setStatusFilter(next);
            toast.info(next ? "Filtered to Under Review" : "Showing all stages");
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
            } else {
              toast.info("No open queries in this scope");
            }
          }}
        />
        {canViewSla ? (
          <KPI
            label="SLA Attention"
            value={slaCases.length}
            status={slaCases.length > 0 ? "danger" : "neutral"}
            icon={<AlertTriangle className="size-3.5" />}
            support="Breached >15 days · Click to view"
            clickHint="View"
            onClick={() => {
              if (slaCases[0]) {
                selectCase(slaCases[0].id);
                setDrawerTab("Checklist");
                toast.error(`Viewing SLA breached file: ${slaCases[0].clientName}`);
              } else {
                toast.info("No SLA breached files");
              }
            }}
          />
        ) : (
          <KPI
            label="Ready for approval"
            value={readyCount}
            status="success"
            icon={<CheckCircle2 className="size-3.5" />}
            support="Assessment complete · Click to view"
            clickHint="View"
            onClick={() => {
              const readyCase = credit.find((c) => c.workflowStatus === "Ready");
              if (readyCase) {
                selectCase(readyCase.id);
                setDrawerTab("Overview");
                toast.success(`Viewing ready file: ${readyCase.clientName}`);
              } else {
                toast.info("No files ready for approval");
              }
            }}
          />
        )}
        <KPI
          label="CIBIL exceptions"
          value={exceptions.length}
          status="warning"
          icon={<ShieldAlert className="size-3.5" />}
          support={cibilOnly ? "Filter active · Click to clear" : "Need sign-off · Click to view"}
          isActive={cibilOnly}
          clickHint="Filter"
          onClick={() => {
            const willFilter = !cibilOnly;
            setCibilOnly(willFilter);
            if (exceptions[0]) {
              selectCase(exceptions[0].id);
              setDrawerTab("Overview");
              toast.warning(`Viewing CIBIL exception: ${exceptions[0].clientName}`);
            } else {
              toast.info("No CIBIL exceptions in this scope");
            }
          }}
        />
      </KPIGroup>

      <FilterBar
        active={
          search !== "" ||
          filterPriority !== "all" ||
          queryOnly ||
          cibilOnly ||
          statusFilter !== null
        }
        onReset={() => {
          setSearch("");
          setFilterPriority("all");
          setQueryOnly(false);
          setCibilOnly(false);
          setStatusFilter(null);
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

      <KanbanBoard>
        {availableColumns.map((col) => {
          const isSlaCol = col === "SLA Attention";
          const list = displayCredit.filter((c) => {
            const isBreached = isCaseSlaBreached(c, currentDemoDate);
            if (isSlaCol) return isBreached;
            if (isBreached) return false;
            return c.workflowStatus === col;
          });

          return (
            <KanbanColumn
              key={col}
              title={COLUMN_LABELS[col] ?? col}
              count={list.length}
              accent={
                isSlaCol
                  ? "danger"
                  : col === "Ready"
                    ? "success"
                    : col === "In Review"
                      ? "review"
                      : "info"
              }
              emptyLabel={isSlaCol ? "No breached applications" : "Queue is clear"}
            >
              {list.map((c) => {
                const sla = getApplicationSla(c, currentDemoDate);
                const isBreached = isCaseSlaBreached(c, currentDemoDate);

                return (
                  <KanbanCard
                    key={c.id}
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
