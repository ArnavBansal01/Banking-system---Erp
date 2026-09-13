import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  FileCheck,
  Landmark,
  ListChecks,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { computeMetrics } from "@/utils/metrics";
import { COLUMN_LABELS, OPS_COLUMNS } from "@/utils/transitions";
import { getApplicationSla, getPostApprovalSla } from "@/utils/dates";
import { getScope } from "@/utils/scope";
import { can } from "@/utils/permissions";
import { inr, longDate } from "@/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPI, KPIGroup } from "@/components/kpi/KPI";
import { CardRow, KanbanBoard, KanbanCard, KanbanColumn } from "@/components/kanban/Kanban";
import { GlassPanel, SectionHeading } from "@/components/ui/GlassPanel";
import { EmptyState, FilterBar, SearchBar, SelectField } from "@/components/ui/Controls";
import { DataList, ProgressBar } from "@/components/ui/DataList";
import { PriorityBadge, QueryBadge, SlaBadge } from "@/components/ui/Badges";

export function OperationsModule() {
  const {
    currentRole,
    currentDemoDate,
    search,
    setSearch,
    filterPriority,
    setFilterPriority,
    selectCase,
    setView,
    setDrawerTab,
  } = useAppStore();
  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const metrics = computeMetrics(visible, currentDemoDate);
  const canViewSla = can(currentRole, "viewSlaAttention");

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const ops = visible
    .filter((c) => c.stage === "disbursement")
    .filter((c) => canViewSla || c.workflowStatus !== "SLA Attention");

  const displayOps = ops.filter((c) => !statusFilter || c.workflowStatus === statusFilter);

  const activeLoans = visible.filter((c) => c.stage === "collections");
  const pendingDocs = ops.filter(
    (c) => c.workflowStatus !== "SLA Attention" && c.documents.some((d) => !d.received),
  );
  const slaCases = ops.filter((c) => c.workflowStatus === "SLA Attention");

  const availableColumns = OPS_COLUMNS.filter((col) => col !== "SLA Attention" || canViewSla);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Operations / AMS"
        subtitle="Post-approval verification, disbursement release and the active loan book"
        crumbs={scope.crumbs}
      />

      <KPIGroup>
        <KPI
          label="Files received"
          value={ops.length}
          icon={<FileCheck className="size-3.5" />}
          support={statusFilter ? `Filtered: ${statusFilter} · Click to reset` : "From credit"}
          isActive={statusFilter === null}
          clickHint="All"
          onClick={() => {
            setStatusFilter(null);
            setSearch("");
            setFilterPriority("all");
            toast.info("Showing all operations files");
          }}
        />
        <KPI
          label="In verification"
          value={metrics.opsProcessing}
          status="warning"
          icon={<ListChecks className="size-3.5" />}
          support={
            statusFilter === "Verification"
              ? "Filter active · Click to clear"
              : "Checklist open · Click to view"
          }
          isActive={statusFilter === "Verification"}
          clickHint="Filter"
          onClick={() => {
            const next = statusFilter === "Verification" ? null : "Verification";
            setStatusFilter(next);
            if (next) {
              const target = ops.find((c) => c.workflowStatus === "Verification");
              if (target) {
                selectCase(target.id);
                setDrawerTab("Checklist");
                toast.info(`Viewing checklist for ${target.clientName}`);
              }
            } else {
              toast.info("Showing all operations files");
            }
          }}
        />
        <KPI
          label="Ready to disburse"
          value={metrics.opsReady}
          status="success"
          icon={<CheckCircle2 className="size-3.5" />}
          support={
            statusFilter === "Ready for Disbursement"
              ? "Filter active · Click to clear"
              : "Cleared checks · Click to view"
          }
          isActive={statusFilter === "Ready for Disbursement"}
          clickHint="View"
          onClick={() => {
            const next =
              statusFilter === "Ready for Disbursement" ? null : "Ready for Disbursement";
            setStatusFilter(next);
            if (next) {
              const target = ops.find((c) => c.workflowStatus === "Ready for Disbursement");
              if (target) {
                selectCase(target.id);
                setDrawerTab("Overview");
                toast.success(`Viewing ready to disburse file: ${target.clientName}`);
              }
            } else {
              toast.info("Showing all operations files");
            }
          }}
        />
        {canViewSla && (
          <KPI
            label="SLA Attention"
            value={slaCases.length}
            status={slaCases.length > 0 ? "danger" : "neutral"}
            icon={<AlertTriangle className="size-3.5" />}
            support="Overdue >15 days · Click to view"
            isActive={statusFilter === "SLA Attention"}
            clickHint="View"
            onClick={() => {
              if (slaCases[0]) {
                selectCase(slaCases[0].id);
                setDrawerTab("Checklist");
                toast.error(`Viewing SLA attention file: ${slaCases[0].clientName}`);
              } else {
                toast.info("No SLA attention files");
              }
            }}
          />
        )}
        <KPI
          label="Disbursed value"
          value={inr(metrics.totalDisbursed, true)}
          icon={<Banknote className="size-3.5" />}
          support="Cumulative volume released"
        />
        <KPI
          label="Active loans"
          value={activeLoans.length}
          status="info"
          icon={<Landmark className="size-3.5" />}
          support="Active repayment portfolio"
        />
      </KPIGroup>

      <FilterBar
        active={search !== "" || filterPriority !== "all" || statusFilter !== null}
        onReset={() => {
          setSearch("");
          setFilterPriority("all");
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
          const list = displayOps.filter((c) => c.workflowStatus === col);
          const isSlaCol = col === "SLA Attention";
          return (
            <KanbanColumn
              key={col}
              title={COLUMN_LABELS[col] ?? col}
              count={list.length}
              accent={
                isSlaCol
                  ? "danger"
                  : col === "Verification"
                    ? "warning"
                    : col === "Ready for Disbursement"
                      ? "success"
                      : "info"
              }
              emptyLabel={isSlaCol ? "No breached SLA files" : "Nothing in this stage"}
            >
              {list.map((c) => {
                const done = c.checklist.filter((i) => i.done).length;
                const sla = getApplicationSla(c, currentDemoDate);
                const postSla = getPostApprovalSla(c, currentDemoDate);

                return (
                  <KanbanCard
                    key={c.id}
                    onClick={() => selectCase(c.id)}
                    accent={
                      isSlaCol ? "danger" : done === c.checklist.length ? "success" : "warning"
                    }
                  >
                    <CardRow>
                      <span className="truncate text-sm font-semibold text-foreground">
                        {c.clientName}
                      </span>
                      {isSlaCol ? (
                        <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-destructive">
                          SLA Breached
                        </span>
                      ) : canViewSla && sla ? (
                        <SlaBadge day={sla.day} total={sla.total} urgency={sla.urgency} />
                      ) : null}
                    </CardRow>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {inr(c.loanAmount, true)} · {c.branch}
                    </p>

                    {isSlaCol ? (
                      <div className="mt-2.5 space-y-1.5 rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-[11px]">
                        <div className="flex items-center justify-between text-destructive font-semibold">
                          <span>Pending verification:</span>
                          <span className="num font-bold">
                            {postSla ? `${postSla.day}d / ${postSla.total}d` : ">15d"}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {c.checklist.length - done} items pending. Click to review & re-open file.
                        </p>
                      </div>
                    ) : (
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
                    )}
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
              meta: (
                <span className="num text-xs text-muted-foreground">
                  {inr(c.outstanding, true)}
                </span>
              ),
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
