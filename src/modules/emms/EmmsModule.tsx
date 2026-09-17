"use client";
import { useEffect, useState } from "react";
import { CalendarClock, Flame, Plus, Target, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { computeMetrics } from "@/utils/metrics";
import { can } from "@/utils/permissions";
import { getScope } from "@/utils/scope";
import { inr, shortDate } from "@/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPI, KPIGroup } from "@/components/kpi/KPI";
import { CardRow, KanbanBoard, KanbanCard, KanbanColumn } from "@/components/kanban/Kanban";
import { GlassPanel, SectionHeading } from "@/components/ui/GlassPanel";
import {
  ActionButton,
  ConfirmationModal,
  EmptyState,
  SelectField,
  TextField,
} from "@/components/ui/Controls";
import { DataList } from "@/components/ui/DataList";
import { PriorityBadge, TemperatureBadge } from "@/components/ui/Badges";
import type { Stage } from "@/types/loan";

const EMMS_STAGE_COLUMNS: { stage: Stage; label: string; accent: "info" | "success" }[] = [
  { stage: "enquiry", label: "Enquiries", accent: "info" },
  { stage: "application", label: "Converted Applications", accent: "success" },
];

export function EmmsModule() {
  const {
    currentRole,
    currentDemoDate,
    search,
    setSearch,
    filterPriority,
    setFilterPriority,
    selectCase,
    createEnquiry,
    fetchAllLoans,
    updateLoanStageAction,
  } = useAppStore();

  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const metrics = computeMetrics(visible, currentDemoDate);
  const [filterTemp, setFilterTemp] = useState<"Hot" | "Warm" | "Cold" | null>(null);

  useEffect(() => {
    fetchAllLoans();
  }, [fetchAllLoans]);

  const allEnquiries = visible.filter((c) => c.stage === "enquiry");
  const enquiries = allEnquiries.filter((c) => !filterTemp || c.temperature === filterTemp);
  const hotLeads = allEnquiries.filter((c) => c.temperature === "Hot");

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [contact, setContact] = useState("");
  const [purpose, setPurpose] = useState("Working capital");
  const [temperature, setTemperature] = useState("Warm");

  const submit = async () => {
    const loanAmount = Number(amount) || 0;
    if (!name.trim() || loanAmount <= 0) {
      toast.error("Enter a customer name and loan amount");
      return;
    }
    try {
      const createdCase = await createEnquiry({
        clientName: name.trim(),
        loanAmount,
        emiAmount: Math.round(loanAmount / 24),
        temperature: temperature as "Hot" | "Warm" | "Cold",
        branch: scope.branch ?? "Chandigarh",
        area: scope.area ?? "Punjab",
        region: scope.region ?? "North",
        assignedOfficer: scope.officer ?? "Arnav",
        purpose,
        contact: contact || "+91 98xxx xxxxx",
      });
      toast.success("Enquiry created in DuckDB", {
        description: `${createdCase.clientName} (${createdCase.id})`,
      });
      setFormOpen(false);
      setName("");
      setAmount("");
      setContact("");
    } catch (err) {
      toast.error("Failed to create enquiry", { description: (err as Error).message });
    }
  };

  const handleDropCase = async (caseId: string, targetStage: Stage) => {
    try {
      await updateLoanStageAction(caseId, targetStage);
      toast.success(`Case updated to ${targetStage}`);
    } catch (err) {
      toast.error("Failed to update case stage");
    }
  };

  const followUpsDue = allEnquiries.filter(
    (c) => c.nextFollowUp !== null && c.nextFollowUp <= currentDemoDate,
  );
  const noFollowUp = allEnquiries.filter((c) => c.nextFollowUp === null);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales / EMMS"
        subtitle="Enquiry pipeline, follow-up discipline and conversion into applications"
        crumbs={scope.crumbs}
        actions={
          can(currentRole, "createEnquiry") ? (
            <ActionButton
              variant="primary"
              icon={<Plus className="size-4" />}
              onClick={() => setFormOpen(true)}
            >
              New Enquiry
            </ActionButton>
          ) : undefined
        }
      />

      <KPIGroup cols={4}>
        <KPI
          label="Total enquiries"
          value={allEnquiries.length}
          icon={<Users className="size-3.5" />}
          support={filterTemp ? `Filter: ${filterTemp} (click to clear)` : "In my scope"}
          isActive={filterTemp === null}
          clickHint="All"
          onClick={() => {
            setFilterTemp(null);
            setSearch("");
            setFilterPriority("all");
            toast.info("Showing all enquiries");
          }}
        />
        <KPI
          label="Hot leads"
          value={hotLeads.length}
          status="danger"
          icon={<Flame className="size-3.5" />}
          support={
            filterTemp === "Hot"
              ? "Active filter (click to clear)"
              : "Highest intent · Click to filter"
          }
          isActive={filterTemp === "Hot"}
          clickHint="Filter"
          onClick={() => {
            if (filterTemp === "Hot") {
              setFilterTemp(null);
              toast.info("Cleared Hot leads filter");
            } else {
              setFilterTemp("Hot");
              toast.info(`Filtered to ${hotLeads.length} Hot leads`);
            }
          }}
        />
        <KPI
          label="Follow-ups due"
          value={followUpsDue.length}
          status={followUpsDue.length ? "warning" : "success"}
          icon={<CalendarClock className="size-3.5" />}
          support="Action required"
        />
        <KPI
          label="Conversion rate"
          value={`${metrics.conversionRate.toFixed(0)}%`}
          status="info"
          icon={<TrendingUp className="size-3.5" />}
          support={`${metrics.applications} converted of ${metrics.totalCases}`}
        />
      </KPIGroup>

      {/* Kanban Board mapped strictly to LoanStage ENUMs */}
      <KanbanBoard>
        {EMMS_STAGE_COLUMNS.map((col) => {
          const list = visible.filter((c) => c.stage === col.stage);
          return (
            <KanbanColumn
              key={col.stage}
              title={col.label}
              count={list.length}
              accent={col.accent}
              emptyLabel={`No cases in ${col.label.toLowerCase()}`}
              onDropCase={(caseId) => handleDropCase(caseId, col.stage)}
            >
              {list.map((c) => (
                <KanbanCard
                  key={c.id}
                  caseId={c.id}
                  onClick={() => selectCase(c.id)}
                  accent={c.temperature === "Hot" ? "danger" : "info"}
                >
                  <CardRow>
                    <span className="truncate text-sm font-semibold text-foreground">
                      {c.clientName}
                    </span>
                    <TemperatureBadge temperature={c.temperature} />
                  </CardRow>
                  <p className="num mt-1 text-xs text-muted-foreground">
                    {c.id} · {inr(c.loanAmount, true)} · {c.branch}
                  </p>
                  <CardRow className="mt-2">
                    <span className="num text-[11px] text-muted-foreground">
                      {c.followUpCount} follow-ups · next {shortDate(c.nextFollowUp)}
                    </span>
                    <PriorityBadge priority={c.priority} />
                  </CardRow>
                </KanbanCard>
              ))}
            </KanbanColumn>
          );
        })}
      </KanbanBoard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel>
          <SectionHeading title="Follow-ups due today or earlier" count={followUpsDue.length} />
          <DataList
            items={followUpsDue.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: `${c.workflowStatus} · scheduled ${shortDate(c.nextFollowUp)}`,
              meta: <TemperatureBadge temperature={c.temperature} />,
              accent: "warning" as const,
            }))}
            onSelect={selectCase}
            empty={
              <EmptyState
                compact
                title="Follow-up discipline is clean"
                hint="Nothing pending on this date"
              />
            }
          />
        </GlassPanel>
        <GlassPanel>
          <SectionHeading title="No follow-up scheduled" count={noFollowUp.length} />
          <DataList
            items={noFollowUp.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: `${c.workflowStatus} · ${c.assignedOfficer}`,
              meta: (
                <span className="num text-xs text-muted-foreground">{inr(c.loanAmount, true)}</span>
              ),
              accent: "info" as const,
            }))}
            onSelect={selectCase}
            empty={<EmptyState compact title="Every enquiry has a next step" />}
          />
        </GlassPanel>
      </div>

      <ConfirmationModal
        open={formOpen}
        title="Create enquiry"
        description={`Captured in ${scope.branch ?? scope.label} and owned by ${scope.officer ?? currentRole}.`}
        confirmLabel="Create enquiry"
        onCancel={() => setFormOpen(false)}
        onConfirm={submit}
      >
        <div className="mt-4 space-y-3">
          <TextField
            label="Customer / entity name"
            value={name}
            onChange={setName}
            placeholder="e.g. Shree Traders"
          />
          <TextField
            label="Loan amount (₹)"
            value={amount}
            onChange={setAmount}
            placeholder="2500000"
          />
          <TextField
            label="Contact number"
            value={contact}
            onChange={setContact}
            placeholder="+91 98765 43210"
          />
          <TextField label="Purpose" value={purpose} onChange={setPurpose} />
          <SelectField
            label="Temperature"
            value={temperature}
            onChange={setTemperature}
            options={[
              { value: "Hot", label: "Hot" },
              { value: "Warm", label: "Warm" },
              { value: "Cold", label: "Cold" },
            ]}
          />
        </div>
      </ConfirmationModal>
    </div>
  );
}
