import { useState } from "react";
import { AlertOctagon, CalendarClock, CheckCircle2, IndianRupee, TrendingDown } from "lucide-react";
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
import type { CollectionUrgency, LoanCase } from "@/types/loan";

const urgencyAccent: Record<CollectionUrgency, "success" | "warning" | "danger"> = {
  healthy: "success",
  due: "warning",
  overdue: "danger",
  resolved: "success",
};

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
  } = useAppStore();
  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const buckets = collectionBuckets(visible, currentDemoDate);
  const active = visible.filter((c) => c.stage === "collections");

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const rawColumns: {
    key: string;
    title: string;
    list: LoanCase[];
    accent: "warning" | "danger" | "success" | "info";
  }[] = [
    { key: "due", title: "Due", list: buckets.due, accent: "warning" },
    { key: "overdue", title: "Overdue", list: buckets.overdue, accent: "danger" },
    { key: "escalated", title: "Escalated", list: buckets.escalated, accent: "danger" },
  ];
  if (buckets.resolved.length > 0)
    rawColumns.push({
      key: "resolved",
      title: "Resolved this cycle",
      list: buckets.resolved,
      accent: "success",
    });

  const columns = rawColumns.filter((col) => !statusFilter || col.key === statusFilter);

  const overdueAmount = buckets.overdue.reduce((a, c) => a + c.emiAmount, 0);
  const collected = active.reduce(
    (a, c) =>
      a +
      c.payments
        .filter((p) => p.date.slice(0, 7) === currentDemoDate.slice(0, 7))
        .reduce((x, p) => x + p.amount, 0),
    0,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Collections"
        subtitle={`Repayment condition as on ${longDate(currentDemoDate)} — change the demo date to move the book`}
        crumbs={scope.crumbs}
      />

      <KPIGroup>
        <KPI
          label="Active loans"
          value={active.length}
          icon={<IndianRupee className="size-3.5" />}
          support={
            statusFilter ? `Filtered: ${statusFilter} · Click to reset` : "In repayment cycle"
          }
          isActive={statusFilter === null}
          clickHint="All"
          onClick={() => {
            setStatusFilter(null);
            setSearch("");
            setFilterPriority("all");
            toast.info("Showing all active loans in repayment");
          }}
        />
        <KPI
          label="Due now"
          value={buckets.due.length}
          status="warning"
          icon={<CalendarClock className="size-3.5" />}
          support={
            statusFilter === "due"
              ? "Filter active · Click to clear"
              : "Inside due window · Click to view"
          }
          isActive={statusFilter === "due"}
          clickHint="View"
          onClick={() => {
            const next = statusFilter === "due" ? null : "due";
            setStatusFilter(next);
            if (next) {
              if (buckets.due[0]) {
                selectCase(buckets.due[0].id);
                setDrawerTab("Overview");
                toast.warning(`Viewing case due now: ${buckets.due[0].clientName}`);
              }
            } else {
              toast.info("Showing all collection columns");
            }
          }}
        />
        <KPI
          label="Overdue"
          value={buckets.overdue.length}
          status="danger"
          icon={<TrendingDown className="size-3.5" />}
          support={
            statusFilter === "overdue"
              ? "Filter active · Click to clear"
              : `${inr(overdueAmount, true)} at risk · Click to view`
          }
          isActive={statusFilter === "overdue"}
          clickHint="View"
          onClick={() => {
            const next = statusFilter === "overdue" ? null : "overdue";
            setStatusFilter(next);
            if (next) {
              if (buckets.overdue[0]) {
                selectCase(buckets.overdue[0].id);
                setDrawerTab("Overview");
                toast.error(`Viewing overdue case: ${buckets.overdue[0].clientName}`);
              }
            } else {
              toast.info("Showing all collection columns");
            }
          }}
        />
        <KPI
          label="Escalated"
          value={buckets.escalated.length}
          status="danger"
          icon={<AlertOctagon className="size-3.5" />}
          support={
            statusFilter === "escalated"
              ? "Filter active · Click to clear"
              : "With higher authority · Click to view"
          }
          isActive={statusFilter === "escalated"}
          clickHint="View"
          onClick={() => {
            const next = statusFilter === "escalated" ? null : "escalated";
            setStatusFilter(next);
            if (next) {
              if (buckets.escalated[0]) {
                selectCase(buckets.escalated[0].id);
                setDrawerTab("Overview");
                toast.error(`Viewing escalated case: ${buckets.escalated[0].clientName}`);
              }
            } else {
              toast.info("Showing all collection columns");
            }
          }}
        />
        <KPI
          label="Collected this month"
          value={inr(collected, true)}
          status="success"
          icon={<CheckCircle2 className="size-3.5" />}
          support={`${buckets.resolved.length} resolved this cycle`}
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
        {columns.map((col) => (
          <KanbanColumn
            key={col.key}
            title={col.title}
            count={col.list.length}
            accent={col.accent}
            emptyLabel="Nothing in this state today"
          >
            {col.list.map((c) => {
              const s = getCollectionState(c, currentDemoDate);
              return (
                <KanbanCard
                  key={c.id}
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
        ))}
      </KanbanBoard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel accent="warning">
          <SectionHeading title="Bounced payment history" count={buckets.bounced.length} />
          <DataList
            items={buckets.bounced.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: `${c.emiHistory.filter((e) => e.bounced).length} bounce(s) · mandate check needed`,
              meta: <BouncedBadge />,
              accent: "warning" as const,
            }))}
            onSelect={selectCase}
            empty={<EmptyState compact title="No bounced payments in this scope" />}
          />
        </GlassPanel>
        <GlassPanel accent="danger">
          <SectionHeading title="Missing next action" count={buckets.missedFollowUps.length} />
          <DataList
            items={buckets.missedFollowUps.map((c) => ({
              id: c.id,
              primary: c.clientName,
              secondary: `${getCollectionState(c, currentDemoDate).label} · no follow-up scheduled`,
              meta: <span className="num text-xs text-muted-foreground">{inr(c.emiAmount)}</span>,
              accent: "danger" as const,
            }))}
            onSelect={selectCase}
            empty={<EmptyState compact title="Every open case has a next action" />}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
