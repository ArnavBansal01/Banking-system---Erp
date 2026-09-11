import { AlertTriangle, ClipboardCheck, Clock, MessageSquare, ShieldAlert } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { computeMetrics } from "@/utils/metrics";
import { getApplicationSla } from "@/utils/dates";
import { COLUMN_LABELS, CREDIT_COLUMNS } from "@/utils/transitions";
import { getScope } from "@/utils/scope";
import { authorityFor } from "@/utils/permissions";
import { inr, pct } from "@/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPI, KPIGroup } from "@/components/kpi/KPI";
import { CardRow, KanbanBoard, KanbanCard, KanbanColumn } from "@/components/kanban/Kanban";
import { GlassPanel, SectionHeading } from "@/components/ui/GlassPanel";
import { EmptyState, FilterBar, SearchBar, SelectField } from "@/components/ui/Controls";
import { DataList } from "@/components/ui/DataList";
import { ExceptionBadge, PriorityBadge, QueryBadge, SlaBadge } from "@/components/ui/Badges";

export function CreditModule() {
  const { currentRole, currentDemoDate, search, setSearch, filterPriority, setFilterPriority, selectCase } =
    useAppStore();
  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const metrics = computeMetrics(visible, currentDemoDate);
  const credit = visible.filter((c) => c.stage === "credit_review");

  const atRisk = credit.filter((c) => {
    const sla = getApplicationSla(c, currentDemoDate);
    return sla && sla.urgency !== "Normal";
  });
  const exceptions = credit.filter((c) => c.cibilException);
  const queries = credit.filter((c) => c.queryRaised);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Credit"
        subtitle="Assessment queue, query loop, deviation authority and the 15-day application SLA"
        crumbs={scope.crumbs}
      />

      <KPIGroup>
        <KPI label="In credit queue" value={credit.length} icon={<ClipboardCheck className="size-3.5" />} support="Awaiting decision" />
        <KPI label="Under review" value={metrics.underReview} status="info" support="Being assessed" />
        <KPI label="Open queries" value={queries.length} status="warning" icon={<MessageSquare className="size-3.5" />} support="Waiting on sales" />
        <KPI
          label="SLA breach risk"
          value={atRisk.length}
          status={atRisk.length ? "danger" : "success"}
          icon={<Clock className="size-3.5" />}
          support="Day 11+ of 15"
        />
        <KPI label="CIBIL exceptions" value={exceptions.length} status="warning" icon={<ShieldAlert className="size-3.5" />} support="Need authority sign-off" />
      </KPIGroup>

      <FilterBar
        active={search !== "" || filterPriority !== "all"}
        onReset={() => {
          setSearch("");
          setFilterPriority("all");
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
        {CREDIT_COLUMNS.map((col) => {
          const list = credit.filter((c) => c.workflowStatus === col);
          return (
            <KanbanColumn
              key={col}
              title={COLUMN_LABELS[col] ?? col}
              count={list.length}
              accent={col === "Ready" ? "success" : col === "In Review" ? "review" : "info"}
              emptyLabel="Queue is clear"
            >
              {list.map((c) => {
                const sla = getApplicationSla(c, currentDemoDate);
                return (
                  <KanbanCard
                    key={c.id}
                    onClick={() => selectCase(c.id)}
                    accent={sla?.urgency === "Critical" ? "danger" : c.cibilException ? "review" : "info"}
                  >
                    <CardRow>
                      <span className="truncate text-sm font-semibold text-foreground">{c.clientName}</span>
                      {sla && <SlaBadge day={sla.day} total={sla.total} urgency={sla.urgency} />}
                    </CardRow>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {inr(c.loanAmount, true)} · CIBIL {c.credit.cibil} · {pct(c.terms.interestRate)}
                    </p>
                    <CardRow className="mt-2">
                      <span className="flex flex-wrap items-center gap-1">
                        {c.queryRaised && <QueryBadge />}
                        {c.cibilException && <ExceptionBadge />}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel accent="danger">
          <SectionHeading
            title="SLA attention"
            count={atRisk.length}
            icon={<AlertTriangle className="size-4 text-destructive" />}
          />
          <DataList
            items={atRisk.map((c) => {
              const sla = getApplicationSla(c, currentDemoDate)!;
              return {
                id: c.id,
                primary: c.clientName,
                secondary: `Day ${sla.day} of ${sla.total} · ${c.workflowStatus}`,
                meta: <SlaBadge day={sla.day} total={sla.total} urgency={sla.urgency} />,
                accent: sla.urgency === "Critical" ? ("danger" as const) : ("warning" as const),
              };
            })}
            onSelect={selectCase}
            empty={<EmptyState compact title="Every application is inside SLA" />}
          />
        </GlassPanel>
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
