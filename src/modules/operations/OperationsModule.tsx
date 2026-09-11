import { Banknote, CheckCircle2, FileCheck, Landmark, ListChecks } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { computeMetrics } from "@/utils/metrics";
import { COLUMN_LABELS, OPS_COLUMNS } from "@/utils/transitions";
import { getApplicationSla } from "@/utils/dates";
import { getScope } from "@/utils/scope";
import { inr, longDate } from "@/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPI, KPIGroup } from "@/components/kpi/KPI";
import { CardRow, KanbanBoard, KanbanCard, KanbanColumn } from "@/components/kanban/Kanban";
import { GlassPanel, SectionHeading } from "@/components/ui/GlassPanel";
import { EmptyState, FilterBar, SearchBar, SelectField } from "@/components/ui/Controls";
import { DataList, ProgressBar } from "@/components/ui/DataList";
import { PriorityBadge, QueryBadge, SlaBadge } from "@/components/ui/Badges";

export function OperationsModule() {
  const { currentRole, currentDemoDate, search, setSearch, filterPriority, setFilterPriority, selectCase } =
    useAppStore();
  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const metrics = computeMetrics(visible, currentDemoDate);
  const ops = visible.filter((c) => c.stage === "disbursement");
  const activeLoans = visible.filter((c) => c.stage === "collections");

  const pendingDocs = ops.filter((c) => c.documents.some((d) => !d.received));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Operations / AMS"
        subtitle="Post-approval verification, disbursement release and the active loan book"
        crumbs={scope.crumbs}
      />

      <KPIGroup>
        <KPI label="Files received" value={ops.length} icon={<FileCheck className="size-3.5" />} support="From credit" />
        <KPI label="In verification" value={metrics.opsProcessing} status="warning" icon={<ListChecks className="size-3.5" />} support="Checklist open" />
        <KPI label="Ready to disburse" value={metrics.opsReady} status="success" icon={<CheckCircle2 className="size-3.5" />} support="Cleared checks" />
        <KPI label="Disbursed value" value={inr(metrics.totalDisbursed, true)} icon={<Banknote className="size-3.5" />} support="Cumulative" />
        <KPI label="Active loans" value={activeLoans.length} status="info" icon={<Landmark className="size-3.5" />} support="In repayment" />
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
        {OPS_COLUMNS.map((col) => {
          const list = ops.filter((c) => c.workflowStatus === col);
          return (
            <KanbanColumn
              key={col}
              title={COLUMN_LABELS[col] ?? col}
              count={list.length}
              accent={col === "Verification" ? "warning" : col === "Ready for Disbursement" ? "success" : "info"}
              emptyLabel="Nothing in this stage"
            >
              {list.map((c) => {
                const done = c.checklist.filter((i) => i.done).length;
                const sla = getApplicationSla(c, currentDemoDate);
                return (
                  <KanbanCard key={c.id} onClick={() => selectCase(c.id)} accent={done === c.checklist.length ? "success" : "warning"}>
                    <CardRow>
                      <span className="truncate text-sm font-semibold text-foreground">{c.clientName}</span>
                      {sla && <SlaBadge day={sla.day} total={sla.total} urgency={sla.urgency} />}
                    </CardRow>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {inr(c.loanAmount, true)} · {c.branch}
                    </p>
                    <div className="mt-2.5">
                      <ProgressBar
                        value={done}
                        max={c.checklist.length}
                        tone={done === c.checklist.length ? "success" : "warning"}
                      />
                      <CardRow className="mt-1.5">
                        <span className="num text-[11px] text-muted-foreground">
                          {done}/{c.checklist.length} checks
                        </span>
                        <span className="flex items-center gap-1">
                          {c.queryRaised && <QueryBadge />}
                          <PriorityBadge priority={c.priority} />
                        </span>
                      </CardRow>
                    </div>
                  </KanbanCard>
                );
              })}
            </KanbanColumn>
          );
        })}
      </KanbanBoard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel accent="warning">
          <SectionHeading title="Pending documents" count={pendingDocs.length} />
          <DataList
            items={pendingDocs.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: c.documents
                .filter((d) => !d.received)
                .map((d) => d.name)
                .join(", "),
              accent: "warning" as const,
            }))}
            onSelect={selectCase}
            empty={<EmptyState compact title="All files are document-complete" />}
          />
        </GlassPanel>
        <GlassPanel accent="success">
          <SectionHeading title="Active loan book" count={activeLoans.length} />
          <DataList
            items={activeLoans.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: `Disbursed ${c.disbursedDate ? longDate(c.disbursedDate) : "—"} · EMI ${inr(c.emiAmount)}`,
              meta: <span className="num text-xs text-muted-foreground">{inr(c.outstanding, true)}</span>,
              accent: "success" as const,
            }))}
            onSelect={selectCase}
            empty={<EmptyState compact title="No active loans in this scope" />}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
