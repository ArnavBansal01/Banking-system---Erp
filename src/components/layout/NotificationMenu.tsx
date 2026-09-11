import * as React from "react";
import {
  Bell,
  AlertCircle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { scopedCases } from "@/utils/scope";
import { collectionBuckets } from "@/utils/metrics";
import { inr } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationMenu() {
  const { currentRole, currentDemoDate, cases, selectCase } = useAppStore();
  const visible = scopedCases(cases, currentRole);
  const overdueCases = collectionBuckets(visible, currentDemoDate).overdue;
  const cibilExceptionCases = visible.filter(
    (c) => c.cibilException && c.stage === "credit_review",
  );
  const escalatedCases = visible.filter((c) => c.escalated);
  const totalAlerts = overdueCases.length + cibilExceptionCases.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${totalAlerts} items need attention`}
          className={cn(
            "group relative grid size-9 place-items-center rounded-xl border border-border/80 bg-surface/80 text-muted-foreground",
            "shadow-xs transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "hover:border-primary/40 hover:bg-surface-raised hover:text-foreground hover:shadow-sm",
            "active:scale-[0.95] cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "data-[state=open]:border-primary/60 data-[state=open]:bg-surface-raised data-[state=open]:text-foreground data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
          )}
        >
          <Bell className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-data-[state=open]:rotate-12" />
          {totalAlerts > 0 && (
            <span className="num absolute -right-1 -top-1 grid min-w-4.5 h-4.5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-extrabold text-destructive-foreground ring-2 ring-background animate-pulse">
              {totalAlerts}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn(
          "z-50 w-80 sm:w-84 overflow-hidden rounded-2xl border border-white/10 dark:border-white/10 bg-popover/95 backdrop-blur-2xl p-2 text-popover-foreground shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top-right",
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50 mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold text-foreground tracking-tight">
              Notifications
            </h3>
            {totalAlerts > 0 ? (
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[9px] font-black text-destructive border border-destructive/20">
                {totalAlerts} Urgent
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black text-emerald-500 border border-emerald-500/20">
                All Clear
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">Scope: {currentRole}</span>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto space-y-1 p-0.5">
          {totalAlerts === 0 && escalatedCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                <CheckCircle2 className="size-5" />
              </div>
              <p className="text-xs font-bold text-foreground">All caught up!</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                No pending alerts.
              </p>
            </div>
          ) : (
            <>
              {/* Overdue Collection Alerts */}
              {overdueCases.map((c) => (
                <DropdownMenuItem
                  key={`overdue-${c.id}`}
                  onClick={() => selectCase(c.id)}
                  className={cn(
                    "group flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-xs outline-none transition-all duration-150 ease-out",
                    "hover:bg-destructive/10 hover:border-destructive/20 border border-transparent active:scale-[0.98]",
                  )}
                >
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive mt-0.5">
                    <AlertCircle className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-foreground truncate">{c.clientName}</span>
                      <span className="rounded-md bg-destructive/15 text-destructive px-1.5 py-0.2 text-[9px] font-black uppercase shrink-0">
                        Overdue
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                      EMI Payment {inr(c.emiAmount)} overdue • ID: {c.id}
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                </DropdownMenuItem>
              ))}

              {/* CIBIL Exception Alerts */}
              {cibilExceptionCases.map((c) => (
                <DropdownMenuItem
                  key={`cibil-${c.id}`}
                  onClick={() => selectCase(c.id)}
                  className={cn(
                    "group flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-xs outline-none transition-all duration-150 ease-out",
                    "hover:bg-warning/10 hover:border-warning/20 border border-transparent active:scale-[0.98]",
                  )}
                >
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning mt-0.5">
                    <ShieldAlert className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-foreground truncate">{c.clientName}</span>
                      <span className="rounded-md bg-warning/15 text-warning px-1.5 py-0.2 text-[9px] font-black uppercase shrink-0">
                        Review Needed
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                      CIBIL score {c.credit.cibil} requires deviation approval
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                </DropdownMenuItem>
              ))}

              {/* Escalated Cases */}
              {escalatedCases.map((c) => (
                <DropdownMenuItem
                  key={`escalated-${c.id}`}
                  onClick={() => selectCase(c.id)}
                  className={cn(
                    "group flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-xs outline-none transition-all duration-150 ease-out",
                    "hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent active:scale-[0.98]",
                  )}
                >
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-500 mt-0.5">
                    <Flame className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-foreground truncate">{c.clientName}</span>
                      <span className="rounded-md bg-rose-500/15 text-rose-500 px-1.5 py-0.2 text-[9px] font-black uppercase shrink-0">
                        Escalated
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                      Case escalated for high priority executive action
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                </DropdownMenuItem>
              ))}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
