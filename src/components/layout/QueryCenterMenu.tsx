"use client";
import * as React from "react";
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Send,
  ExternalLink,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { getScope, scopedCases } from "@/utils/scope";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/loan";
import { getNextHigherRoles, ROLE_HIERARCHY_LEVEL } from "@/utils/permissions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function getQueryDestination(role: Role): string {
  if (role === "MD") return "None (Apex Authority)";
  const higher = getNextHigherRoles(role);
  return higher.length > 0 ? higher.join(", ") : "Higher Management";
}

export function QueryCenterMenu() {
  const { currentRole, cases, selectCase, setDrawerTab, raiseQuery, resolveQuery } = useAppStore();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"pending" | "ask" | "history">("pending");

  // State for asking a query
  const [selectedCaseId, setSelectedCaseId] = React.useState<string>("");
  const [newQuestion, setNewQuestion] = React.useState("");

  // State for resolving a query
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);
  const [resolutionText, setResolutionText] = React.useState("");

  const scope = getScope(currentRole);
  const visible = React.useMemo(() => scopedCases(cases, currentRole), [cases, currentRole]);

  // Extract all queries with associated case metadata
  const allQueriesWithCase = React.useMemo(() => {
    return visible.flatMap((c) =>
      (c.queries ?? []).map((q) => ({
        ...q,
        caseId: c.id,
        clientName: c.clientName,
        caseStage: c.stage,
      })),
    );
  }, [visible]);

  // Queries awaiting action from this role (and not authored by self)
  const pendingForMe = React.useMemo(() => {
    return allQueriesWithCase.filter((q) => {
      if (q.status !== "OPEN") return false;
      const isAuthor =
        q.raisedByRole === currentRole ||
        q.raisedBy === (scope?.officer ?? currentRole) ||
        (currentRole === "Officer" && q.raisedByRole === "Officer");
      if (isAuthor) return false;
      return q.targetRoles.includes(currentRole);
    });
  }, [allQueriesWithCase, currentRole, scope]);

  // Queries sent by this role to higher authorities
  const mySentQueries = React.useMemo(() => {
    return allQueriesWithCase.filter(
      (q) =>
        q.status === "OPEN" &&
        (q.raisedByRole === currentRole ||
          q.raisedBy === (scope?.officer ?? currentRole) ||
          (currentRole === "Officer" && q.raisedByRole === "Officer")),
    );
  }, [allQueriesWithCase, currentRole, scope]);

  const resolvedQueries = React.useMemo(() => {
    return allQueriesWithCase.filter((q) => q.status === "RESOLVED");
  }, [allQueriesWithCase]);

  // Auto-select first case if not set
  React.useEffect(() => {
    if (!selectedCaseId && visible.length > 0) {
      setSelectedCaseId(visible[0]?.id ?? "");
    }
  }, [visible, selectedCaseId]);

  const destination = getQueryDestination(currentRole);

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !newQuestion.trim()) return;
    if (currentRole === "MD") {
      toast.error("Managing Director does not raise operational queries.");
      return;
    }

    const actor = currentRole === "Officer" ? (scope?.officer ?? "Arnav") : currentRole;
    raiseQuery(selectedCaseId, newQuestion.trim(), actor, currentRole);
    setNewQuestion("");
    toast.success(`Query raised to ${destination}`);
    setTab("history");
  };

  const handleResolveSubmit = (caseId: string, queryId: string) => {
    if (!resolutionText.trim()) return;
    const actor = currentRole === "Officer" ? (scope?.officer ?? "Arnav") : currentRole;
    resolveQuery(caseId, queryId, resolutionText.trim(), actor, currentRole);
    setResolutionText("");
    setResolvingId(null);
    toast.success("Query resolved and status updated in DuckDB");
  };

  const handleGoToCase = (caseId: string) => {
    selectCase(caseId);
    setDrawerTab("Queries");
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Query center: ${pendingForMe.length} queries need action`}
          className={cn(
            "group relative grid size-9 place-items-center rounded-xl border border-border/80 bg-surface/80 text-muted-foreground",
            "shadow-xs transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "hover:border-primary/40 hover:bg-surface-raised hover:text-foreground hover:shadow-sm",
            "active:scale-[0.95] cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "data-[state=open]:border-primary/60 data-[state=open]:bg-surface-raised data-[state=open]:text-foreground data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
          )}
        >
          <HelpCircle className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110" />
          {pendingForMe.length > 0 && (
            <span className="num absolute -right-1 -top-1 grid min-w-4.5 h-4.5 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-background animate-pulse">
              {pendingForMe.length}
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border/50 bg-surface/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
                <HelpCircle className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-sm font-extrabold tracking-tight text-foreground">
                  Queries & Clarifications Center
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground">
                  Hierarchical query tracking and resolution workflow
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-6">
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                Role: {currentRole}
              </span>
            </div>
          </div>

          {/* Segmented Navigation Tabs */}
          <div className="mt-3 flex gap-1 rounded-xl bg-surface/80 p-1 border border-border/50">
            <button
              type="button"
              onClick={() => setTab("pending")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer",
                tab === "pending"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>Action Needed</span>
              {pendingForMe.length > 0 && (
                <span className="grid size-4 place-items-center rounded-full bg-amber-500 text-[9px] font-black text-white">
                  {pendingForMe.length}
                </span>
              )}
            </button>

            {currentRole !== "MD" && (
              <button
                type="button"
                onClick={() => setTab("ask")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer",
                  tab === "ask"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Ask a Query</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setTab("history")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer",
                tab === "history"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>Queries Log ({allQueriesWithCase.length})</span>
            </button>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: ACTION NEEDED */}
          {tab === "pending" && (
            <div className="space-y-3">
              {pendingForMe.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-foreground">No Pending Queries for You</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
                    There are currently no open queries assigned to your designation ({currentRole})
                    requiring resolution.
                  </p>
                </div>
              ) : (
                pendingForMe.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-500 uppercase shrink-0">
                          Awaiting Resolution
                        </span>
                        <button
                          type="button"
                          onClick={() => handleGoToCase(q.caseId)}
                          className="font-extrabold text-xs text-foreground truncate hover:text-primary hover:underline cursor-pointer flex items-center gap-1"
                        >
                          {q.clientName} ({q.caseId})
                          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                        </button>
                      </div>
                      <span className="num text-[10px] text-muted-foreground shrink-0">
                        {q.raisedAt.replace("T", " ")}
                      </span>
                    </div>

                    <div className="rounded-lg bg-surface/70 p-2.5 border border-border/60">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                        <span className="font-bold text-foreground">
                          {q.raisedBy} ({q.raisedByRole})
                        </span>{" "}
                        asked:
                      </div>
                      <p className="text-xs font-medium text-foreground leading-relaxed">
                        "{q.question}"
                      </p>
                    </div>

                    {resolvingId === q.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          placeholder="Provide your clarification / resolution remark..."
                          className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setResolvingId(null)}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!resolutionText.trim()}
                            onClick={() => handleResolveSubmit(q.caseId, q.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1 text-xs font-semibold text-success-foreground shadow-xs hover:bg-success/90 disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle2 className="size-3" />
                            Submit Resolution
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[10px] text-muted-foreground">
                          Cannot be self-resolved by author
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setResolvingId(q.id);
                            setResolutionText("");
                          }}
                          className="inline-flex items-center gap-1 font-bold text-primary hover:underline cursor-pointer text-xs"
                        >
                          Respond & Resolve Query →
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ASK A QUERY */}
          {tab === "ask" && (
            <form onSubmit={handleAskSubmit} className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">Hierarchy-Targeted Routing</p>
                  <p className="text-muted-foreground mt-0.5">
                    As an <span className="font-bold text-foreground">{currentRole}</span>, your
                    query will automatically be routed directly to the{" "}
                    <span className="font-bold text-primary">{destination}</span>.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Select Loan Case</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                >
                  {visible.map((c) => (
                    <option key={c.id} value={c.id} className="bg-popover">
                      {c.clientName} ({c.id}) · Stage: {c.stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Query / Clarification Details
                </label>
                <textarea
                  rows={3}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="State the document discrepancy, collateral question, or borrower clarification needed..."
                  className="w-full resize-none rounded-xl border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  Recipient: <span className="font-bold text-foreground">{destination}</span>
                </span>
                <button
                  type="submit"
                  disabled={!newQuestion.trim() || !selectedCaseId}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="size-3.5" />
                  Send Query to {destination}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: QUERIES LOG & HISTORY */}
          {tab === "history" && (
            <div className="space-y-4">
              {/* Sent Queries awaiting response */}
              {mySentQueries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3" />
                    Queries Sent by Me (Awaiting Higher Authority)
                  </h4>
                  {mySentQueries.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleGoToCase(q.caseId)}
                          className="font-bold text-foreground hover:underline hover:text-primary flex items-center gap-1"
                        >
                          {q.clientName} ({q.caseId})
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </button>
                        <span className="rounded-md bg-amber-500/20 text-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase">
                          Pending with {q.targetRoles.join(", ")}
                        </span>
                      </div>
                      <p className="text-foreground/90 font-medium">"{q.question}"</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-amber-500/15">
                        <span>
                          Submitted by {q.raisedBy} ({q.raisedByRole})
                        </span>
                        <span className="num">{q.raisedAt.replace("T", " ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resolved Queries */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-success" />
                  Resolved Queries History ({resolvedQueries.length})
                </h4>

                {resolvedQueries.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-3 text-center">
                    No resolved queries recorded yet.
                  </p>
                ) : (
                  resolvedQueries.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-border/80 bg-surface/50 p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleGoToCase(q.caseId)}
                          className="font-bold text-foreground hover:underline hover:text-primary flex items-center gap-1"
                        >
                          {q.clientName} ({q.caseId})
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </button>
                        <span className="rounded-md bg-success/15 text-success px-1.5 py-0.5 text-[9px] font-black uppercase">
                          Resolved
                        </span>
                      </div>
                      <p className="text-foreground/80 italic">"{q.question}"</p>
                      {q.resolution && (
                        <div className="rounded-lg border border-success/20 bg-success/5 p-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-success font-semibold">
                            <span>
                              Resolution by {q.resolvedBy} ({q.resolvedByRole})
                            </span>
                            <span className="num">{q.resolvedAt?.replace("T", " ")}</span>
                          </div>
                          <p className="text-foreground font-medium">{q.resolution}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
