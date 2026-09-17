import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  FileCheck,
  Landmark,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { computeMetrics } from "@/utils/metrics";
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
import type { Stage } from "@/types/loan";

const OPS_STAGE_COLUMNS: { stage: Stage; label: string; accent: "warning" | "success" }[] = [
  { stage: "credit approved", label: "Approved (Verification & Checklist)", accent: "warning" },
  { stage: "disbursed", label: "Disbursed", accent: "success" },
];

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
    fetchAllLoans,
    updateLoanStageAction,
  } = useAppStore();

  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const metrics = computeMetrics(visible, currentDemoDate);
  const canViewSla = can(currentRole, "viewSlaAttention");

  const [stageFilter, setStageFilter] = useState<Stage | null>(null);

  useEffect(() => {
    fetchAllLoans();
  }, [fetchAllLoans]);

  // Operations queue covers credit approved and disbursed stages
  const ops = visible.filter((c) => c.stage === "credit approved" || c.stage === "disbursed");

  const displayOps = ops.filter((c) => !stageFilter || c.stage === stageFilter);
  const activeLoans = visible.filter((c) => c.stage === "active loan" || c.stage === "disbursed");
  const pendingDocs = ops.filter((c) => c.documents.some((d) => !d.received));
  const slaCases = ops.filter((c) => c.workflowStatus === "SLA Attention");

  const handleDropCase = async (caseId: string, targetStage: Stage) => {
    if (targetStage === "disbursed" && !can(currentRole, "processDisbursement")) {
      toast.error("Only Branch Manager or higher authority can disburse funds.");
      return;
    }
    if (targetStage === "credit approved" && !can(currentRole, "approve")) {
      toast.error("Only Branch Manager or higher authority can approve loans.");
      return;
    }
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
        title="Operations / AMS"
        subtitle="Post-approval verification, disbursement release and the active loan book"
        crumbs={scope.crumbs}
      />

      <KPIGroup>
        <KPI
          label="Operations queue"
          value={ops.length}
          icon={<FileCheck className="size-3.5" />}
          support={stageFilter ? `Filtered: ${stageFilter} · Click to reset` : "From credit"}
          isActive={stageFilter === null}
          clickHint="All"
          onClick={() => {
            setStageFilter(null);
            setSearch("");
            setFilterPriority("all");
            toast.info("Showing all operations files");
          }}
        />
        <KPI
          label="Credit approved"
          value={ops.filter((c) => c.stage === "credit approved").length}
          status="warning"
          icon={<ListChecks className="size-3.5" />}
          support={
            stageFilter === "credit approved"
              ? "Filter active · Click to clear"
              : "Checklist open · Click to view"
          }
          isActive={stageFilter === "credit approved"}
          clickHint="Filter"
          onClick={() => {
            const next = stageFilter === "credit approved" ? null : "credit approved";
            setStageFilter(next);
            toast.info(next ? "Filtered to Approved" : "Showing all stages");
          }}
        />
        <KPI
          label="Disbursed"
          value={ops.filter((c) => c.stage === "disbursed").length}
          status="success"
          icon={<Banknote className="size-3.5" />}
          support={
            stageFilter === "disbursed"
              ? "Filter active · Click to clear"
              : "Released · Click to filter"
          }
          isActive={stageFilter === "disbursed"}
          clickHint="Filter"
          onClick={() => {
            const next = stageFilter === "disbursed" ? null : "disbursed";
            setStageFilter(next);
            toast.info(next ? "Filtered to Disbursed" : "Showing all stages");
          }}
        />
        <KPI
          label="Active portfolio"
          value={activeLoans.length}
          status="info"
          icon={<Landmark className="size-3.5" />}
          support="Click to view collections"
          clickHint="Collections"
          onClick={() => {
            setView("Collections");
            toast.info("Navigated to Collections workspace");
          }}
        />
      </KPIGroup>

      <FilterBar
        active={Boolean(search) || filterPriority !== "all" || stageFilter !== null}
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
        {OPS_STAGE_COLUMNS.map((col) => {
          const list = displayOps.filter((c) => c.stage === col.stage);

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
                const sla = getPostApprovalSla(c, currentDemoDate);
                const docsReceived = c.documents.filter((d) => d.received).length;
                const docsTotal = c.documents.length || 3;

                return (
                  <KanbanCard
                    key={c.id}
                    caseId={c.id}
                    onClick={() => selectCase(c.id)}
                    accent={col.stage === "disbursed" ? "success" : "warning"}
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
                      {inr(c.loanAmount, true)} · {c.terms.product} · {c.branch}
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Checklist</span>
                        <span className="num">
                          {docsReceived}/{docsTotal}
                        </span>
                      </div>
                      <ProgressBar value={docsReceived} max={docsTotal} />
                    </div>
                    <CardRow className="mt-2">
                      <span className="flex items-center gap-1">
                        {c.queryRaised && <QueryBadge />}
                        {col.stage === "disbursed" && (
                          <span className="rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
                            Disbursed
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

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel>
          <SectionHeading title="Pending documentation" count={pendingDocs.length} />
          <DataList
            items={pendingDocs.map((c) => {
              const missing = c.documents.filter((d) => !d.received).map((d) => d.name);
              return {
                id: c.id,
                primary: c.clientName,
                secondary: missing.length
                  ? `Awaiting: ${missing.join(", ")}`
                  : "All documents verified",
                meta: (
                  <span className="num text-xs text-muted-foreground">
                    {inr(c.loanAmount, true)}
                  </span>
                ),
                accent: "warning" as const,
              };
            })}
            onSelect={(id) => {
              selectCase(id);
              setDrawerTab("Verification");
            }}
            empty={<EmptyState compact title="All documentation complete" />}
          />
        </GlassPanel>

        <GlassPanel>
          <SectionHeading
            title="Disbursed files"
            count={ops.filter((c) => c.stage === "disbursed").length}
          />
          <DataList
            items={ops
              .filter((c) => c.stage === "disbursed")
              .map((c) => ({
                id: c.id,
                primary: c.clientName,
                secondary: `Disbursed ${c.disbursedDate ? longDate(c.disbursedDate) : "recently"} · ${c.terms.repayment}`,
                meta: (
                  <span className="num text-xs font-semibold text-success">
                    {inr(c.loanAmount, true)}
                  </span>
                ),
                accent: "success" as const,
              }))}
            onSelect={(id) => {
              selectCase(id);
              setDrawerTab("Disbursement");
            }}
            empty={<EmptyState compact title="No disbursements yet" />}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
