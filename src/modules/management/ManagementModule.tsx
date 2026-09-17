import { Activity, Banknote, Layers, Percent, Target } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useVisibleCases } from "@/modules/useVisibleCases";
import { collectionBuckets, computeMetrics } from "@/utils/metrics";
import { drillDimension, getScope, groupBy } from "@/utils/scope";
import { inr, pct } from "@/utils/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPI, KPIGroup, MetricCard } from "@/components/kpi/KPI";
import { GlassPanel, SectionHeading } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/Controls";
import { DataList, ProgressBar } from "@/components/ui/DataList";

const DIM_LABEL: Record<string, string> = {
  region: "Region",
  area: "Area",
  branch: "Branch",
  assignedOfficer: "Officer",
};

export function ManagementModule() {
  const { currentRole, currentDemoDate, selectCase, setView } = useAppStore();
  const visible = useVisibleCases();
  const scope = getScope(currentRole);
  const metrics = computeMetrics(visible, currentDemoDate);
  const buckets = collectionBuckets(visible, currentDemoDate);
  const dim = drillDimension(currentRole);
  const groups = groupBy(visible, dim).sort(
    (a, b) =>
      b.cases.reduce((x, c) => x + c.loanAmount, 0) - a.cases.reduce((x, c) => x + c.loanAmount, 0),
  );
  const maxValue = Math.max(1, ...groups.map((g) => g.cases.reduce((x, c) => x + c.loanAmount, 0)));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Management"
        subtitle={`Portfolio view for ${scope.label} — drilled by ${DIM_LABEL[dim]?.toLowerCase() ?? dim}`}
        crumbs={scope.crumbs}
      />

      <KPIGroup cols={6}>
        <KPI
          label="Portfolio value"
          value={inr(metrics.totalLoanValue, true)}
          icon={<Layers className="size-3.5" />}
          support={`${metrics.totalCases} cases under management`}
        />
        <KPI
          label="Disbursed"
          value={inr(metrics.totalDisbursed, true)}
          status="success"
          icon={<Banknote className="size-3.5" />}
          support={`${metrics.activeLoans} active loans disbursed`}
        />
        <KPI
          label="Conversion"
          value={`${metrics.conversionRate.toFixed(0)}%`}
          status="info"
          icon={<Activity className="size-3.5" />}
          support={`${metrics.enquiries} total enquiries`}
        />
        <KPI
          label="Overdue"
          value={buckets.overdue.length}
          status="danger"
          support={`${inr(metrics.overdueAmount, true)} at risk · View in Collections`}
          clickHint="View"
          onClick={() => {
            setView("Collections");
            toast.info("Navigated to Collections overdue ledger");
          }}
        />
        <KPI
          label="Escalations"
          value={buckets.escalated.length}
          status="warning"
          support="Needing authority · View in Collections"
          clickHint="View"
          onClick={() => {
            setView("Collections");
            toast.info("Navigated to Collections escalations queue");
          }}
        />
        <KPI
          label="Avg rate"
          value={pct(metrics.avgRate)}
          icon={<Percent className="size-3.5" />}
          support={`Avg ticket ${inr(metrics.avgTicket, true)}`}
        />
      </KPIGroup>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel className="lg:col-span-2" padded>
          <SectionHeading title={`${DIM_LABEL[dim] ?? dim} performance`} count={groups.length} />
          {groups.length === 0 ? (
            <EmptyState title="No cases in this scope" />
          ) : (
            <ul className="space-y-3">
              {groups.map((g) => {
                const value = g.cases.reduce((x, c) => x + c.loanAmount, 0);
                const od = collectionBuckets(g.cases, currentDemoDate).overdue.length;
                return (
                  <li key={g.name}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-foreground">{g.name}</span>
                      <span className="num text-sm font-semibold text-foreground">
                        {inr(value, true)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar
                        value={value}
                        max={maxValue}
                        tone={od > 0 ? "warning" : "primary"}
                      />
                    </div>
                    <p className="num mt-1 text-[11px] text-muted-foreground">
                      {g.cases.length} cases · {od} overdue
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassPanel>

        <div className="space-y-4">
          <MetricCard
            title="Disbursement vs target"
            value={inr(metrics.totalDisbursed, true)}
            footer={`Target ${inr(metrics.target, true)}`}
          >
            <ProgressBar value={metrics.totalDisbursed} max={metrics.target} tone="success" />
          </MetricCard>
          <MetricCard title="Pipeline health" footer="Cases by stage">
            <ul className="space-y-2 text-sm">
              {[
                ["Enquiries", metrics.enquiries],
                ["Credit review", metrics.pendingCredit],
                ["Operations", metrics.opsReceived],
                ["Active loans", metrics.activeLoans],
              ].map(([label, value]) => (
                <li key={String(label)} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="num font-semibold text-foreground">{value}</span>
                </li>
              ))}
            </ul>
          </MetricCard>
          <MetricCard title="SLA watch" footer="Applications in process only">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">At risk</span>
                <span className="num font-semibold text-warning">{metrics.slaAtRisk}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Breached</span>
                <span className="num font-semibold text-destructive">{metrics.slaCritical}</span>
              </li>
            </ul>
          </MetricCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel accent="danger">
          <SectionHeading
            title="Highest exposure at risk"
            count={buckets.overdue.length}
            icon={<Target className="size-4 text-destructive" />}
          />
          <DataList
            items={[...buckets.overdue, ...buckets.escalated]
              .sort((a, b) => b.outstanding - a.outstanding)
              .map((c) => ({
                id: c.id,
                primary: c.clientName,
                secondary: `${c.branch} · ${c.assignedOfficer} · outstanding ${inr(c.outstanding, true)}`,
                meta: <span className="num text-xs text-destructive">{inr(c.emiAmount)}</span>,
                accent: "danger" as const,
              }))}
            onSelect={selectCase}
            empty={<EmptyState compact title="No overdue exposure in this scope" />}
          />
        </GlassPanel>
        <GlassPanel>
          <SectionHeading title="Largest cases" count={visible.length} />
          <DataList
            items={[...visible]
              .sort((a, b) => b.loanAmount - a.loanAmount)
              .slice(0, 8)
              .map((c) => ({
                id: c.id,
                primary: c.clientName,
                secondary: `${c.stage.replace("_", " ")} · ${c.workflowStatus} · ${c.branch}`,
                meta: (
                  <span className="num text-xs text-muted-foreground">
                    {inr(c.loanAmount, true)}
                  </span>
                ),
                accent: "info" as const,
              }))}
            onSelect={selectCase}
            empty={<EmptyState compact title="No cases in this scope" />}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
