import { useState } from "react";
import { CalendarClock, Flame, Plus, Target, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { computeMetrics } from "@/utils/metrics";
import { COLUMN_LABELS, EMMS_COLUMNS } from "@/utils/transitions";
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
  FilterBar,
  SearchBar,
  SelectField,
  TextField,
} from "@/components/ui/Controls";
import { DataList } from "@/components/ui/DataList";
import { PriorityBadge, TemperatureBadge } from "@/components/ui/Badges";

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
  } = useAppStore();
  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const metrics = computeMetrics(visible, currentDemoDate);
  const enquiries = visible.filter((c) => c.stage === "enquiry");

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [contact, setContact] = useState("");
  const [purpose, setPurpose] = useState("Working capital");
  const [temperature, setTemperature] = useState("Warm");

  const submit = () => {
    const loanAmount = Number(amount) || 0;
    if (!name.trim() || loanAmount <= 0) {
      toast.error("Enter a customer name and loan amount");
      return;
    }
    createEnquiry({
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
    toast.success("Enquiry created", { description: name.trim() });
    setFormOpen(false);
    setName("");
    setAmount("");
    setContact("");
  };

  const followUpsDue = enquiries.filter(
    (c) => c.nextFollowUp !== null && c.nextFollowUp <= currentDemoDate,
  );
  const noFollowUp = enquiries.filter((c) => c.nextFollowUp === null);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales / EMMS"
        subtitle="Enquiry pipeline, follow-up discipline and conversion into applications"
        crumbs={scope.crumbs}
        actions={
          can(currentRole, "createEnquiry") ? (
            <ActionButton variant="primary" icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
              New Enquiry
            </ActionButton>
          ) : undefined
        }
      />

      <KPIGroup>
        <KPI label="Total enquiries" value={enquiries.length} icon={<Users className="size-3.5" />} support="In my scope" />
        <KPI
          label="Hot leads"
          value={enquiries.filter((c) => c.temperature === "Hot").length}
          status="danger"
          icon={<Flame className="size-3.5" />}
          support="Highest intent"
        />
        <KPI
          label="Follow-ups due"
          value={followUpsDue.length}
          status={followUpsDue.length ? "warning" : "success"}
          icon={<CalendarClock className="size-3.5" />}
          support="On or before demo date"
        />
        <KPI
          label="Conversion"
          value={`${metrics.conversionRate.toFixed(0)}%`}
          status="info"
          icon={<TrendingUp className="size-3.5" />}
          support={`${metrics.applications} converted`}
        />
        <KPI
          label="Pipeline value"
          value={inr(metrics.totalLoanValue, true)}
          icon={<Target className="size-3.5" />}
          support={`Avg ${inr(metrics.avgTicket, true)}`}
        />
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
        {EMMS_COLUMNS.map((col) => {
          const list = enquiries.filter((c) => c.workflowStatus === col);
          return (
            <KanbanColumn
              key={col}
              title={COLUMN_LABELS[col] ?? col}
              count={list.length}
              accent={col === "Interested" ? "success" : "info"}
              emptyLabel="No enquiries here"
            >
              {list.map((c) => (
                <KanbanCard key={c.id} onClick={() => selectCase(c.id)} accent={c.temperature === "Hot" ? "danger" : "info"}>
                  <CardRow>
                    <span className="truncate text-sm font-semibold text-foreground">{c.clientName}</span>
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
            empty={<EmptyState compact title="Follow-up discipline is clean" hint="Nothing pending on this date" />}
          />
        </GlassPanel>
        <GlassPanel>
          <SectionHeading title="No follow-up scheduled" count={noFollowUp.length} />
          <DataList
            items={noFollowUp.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: `${c.workflowStatus} · ${c.assignedOfficer}`,
              meta: <span className="num text-xs text-muted-foreground">{inr(c.loanAmount, true)}</span>,
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
          <TextField label="Customer / entity name" value={name} onChange={setName} placeholder="e.g. Shree Traders" />
          <TextField label="Loan amount (₹)" value={amount} onChange={setAmount} placeholder="2500000" />
          <TextField label="Contact number" value={contact} onChange={setContact} placeholder="+91 98765 43210" />
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
