import * as React from "react";
import {
  Bell,
  AlertCircle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  Clock,
  AlertTriangle,
  MessageSquare,
  CheckCheck,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getScope, scopedCases } from "@/utils/scope";
import { collectionBuckets } from "@/utils/metrics";
import { inr } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/loan";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getNotificationIcon(type: AppNotification["type"]) {
  switch (type) {
    case "escalation":
      return {
        icon: <Flame className="size-3.5" />,
        color: "text-rose-500 bg-rose-500/15 border-rose-500/20",
        badge: "bg-rose-500/15 text-rose-500",
        label: "Escalated",
      };
    case "approval":
      return {
        icon: <CheckCircle2 className="size-3.5" />,
        color: "text-emerald-500 bg-emerald-500/15 border-emerald-500/20",
        badge: "bg-emerald-500/15 text-emerald-500",
        label: "Approved",
      };
    case "assignment":
      return {
        icon: <UserCheck className="size-3.5" />,
        color: "text-blue-500 bg-blue-500/15 border-blue-500/20",
        badge: "bg-blue-500/15 text-blue-500",
        label: "Assigned",
      };
    case "due":
      return {
        icon: <AlertCircle className="size-3.5" />,
        color: "text-amber-500 bg-amber-500/15 border-amber-500/20",
        badge: "bg-amber-500/15 text-amber-500",
        label: "Payment Due",
      };
    case "followup":
      return {
        icon: <Clock className="size-3.5" />,
        color: "text-indigo-500 bg-indigo-500/15 border-indigo-500/20",
        badge: "bg-indigo-500/15 text-indigo-500",
        label: "Follow-up",
      };
    case "query":
      return {
        icon: <AlertTriangle className="size-3.5" />,
        color: "text-amber-500 bg-amber-500/15 border-amber-500/20",
        badge: "bg-amber-500/15 text-amber-500",
        label: "Query",
      };
    case "note":
      return {
        icon: <MessageSquare className="size-3.5" />,
        color: "text-violet-500 bg-violet-500/15 border-violet-500/20",
        badge: "bg-violet-500/15 text-violet-500",
        label: "Note",
      };
    default:
      return {
        icon: <AlertCircle className="size-3.5" />,
        color: "text-primary bg-primary/15 border-primary/20",
        badge: "bg-primary/15 text-primary",
        label: "Alert",
      };
  }
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

export function NotificationMenu() {
  const {
    currentRole,
    currentDemoDate,
    cases,
    selectCase,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAppStore();

  const scope = getScope(currentRole);
  const visible = scopedCases(cases, currentRole);

  // Filter store notifications by role & officer scope
  const relevantNotifications = React.useMemo(() => {
    return notifications.filter((n) => {
      if (!n.targetRoles.includes(currentRole)) return false;
      if (currentRole === "Officer" && n.targetOfficer && scope?.officer) {
        return n.targetOfficer === scope.officer;
      }
      return true;
    });
  }, [notifications, currentRole, scope]);

  // Date-based and condition-based dynamic alerts
  const overdueCases = React.useMemo(() => {
    return collectionBuckets(visible, currentDemoDate).overdue;
  }, [visible, currentDemoDate]);

  const followUpTodayCases = React.useMemo(() => {
    if (currentRole === "Officer") {
      return visible.filter(
        (c) => c.nextFollowUp === currentDemoDate && c.assignedOfficer === scope?.officer,
      );
    }
    return [];
  }, [visible, currentRole, currentDemoDate, scope]);

  const cibilExceptionCases = React.useMemo(() => {
    if (currentRole === "Regional Manager" || currentRole === "MD") {
      return visible.filter(
        (c) => c.cibilException && (c.stage === "application" || c.stage === "credit approved"),
      );
    }
    return [];
  }, [visible, currentRole]);

  const unreadStoreCount = relevantNotifications.filter((n) => !n.read).length;
  const dynamicAlertsCount =
    overdueCases.length + followUpTodayCases.length + cibilExceptionCases.length;
  const totalAlerts = unreadStoreCount + dynamicAlertsCount;

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
          "z-50 w-84 sm:w-92 overflow-hidden rounded-2xl border border-white/10 dark:border-white/10 bg-popover/95 backdrop-blur-2xl p-2 text-popover-foreground shadow-2xl",
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
            <h3 className="text-xs font-extrabold text-foreground tracking-tight">Notifications</h3>
            {totalAlerts > 0 ? (
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[9px] font-black text-destructive border border-destructive/20">
                {totalAlerts} New
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black text-emerald-500 border border-emerald-500/20">
                All Clear
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadStoreCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsAsRead()}
                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
              >
                <CheckCheck className="size-3" />
                Mark all read
              </button>
            )}
            <span className="text-[10px] font-medium text-muted-foreground border-l border-border/50 pl-2">
              {currentRole}
            </span>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-88 overflow-y-auto space-y-1 p-0.5">
          {totalAlerts === 0 && relevantNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                <CheckCircle2 className="size-5" />
              </div>
              <p className="text-xs font-bold text-foreground">All caught up!</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                No pending alerts or notifications for {currentRole}.
              </p>
            </div>
          ) : (
            <>
              {/* Dynamic Follow-up Due Today (For Officer) */}
              {followUpTodayCases.map((c) => (
                <DropdownMenuItem
                  key={`followup-today-${c.id}`}
                  onClick={() => selectCase(c.id)}
                  className={cn(
                    "group flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-xs outline-none transition-all duration-150 ease-out",
                    "hover:bg-indigo-500/10 hover:border-indigo-500/20 border border-transparent active:scale-[0.98]",
                  )}
                >
                  <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-indigo-500/15 text-indigo-500 mt-0.5">
                    <Clock className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-foreground truncate">
                        {c.clientName}
                      </span>
                      <span className="rounded-md bg-indigo-500/15 text-indigo-500 px-1.5 py-0.2 text-[9px] font-black uppercase shrink-0">
                        Follow-up Today
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                      Scheduled follow-up due today ({c.nextFollowUp}) • ID: {c.id}
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                </DropdownMenuItem>
              ))}

              {/* Dynamic Overdue Collection Alerts */}
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
                      <span className="font-extrabold text-foreground truncate">
                        {c.clientName}
                      </span>
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

              {/* Dynamic CIBIL Exception Alerts (Regional / MD) */}
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
                      <span className="font-extrabold text-foreground truncate">
                        {c.clientName}
                      </span>
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

              {/* Store-based Activity Notifications */}
              {relevantNotifications.map((n) => {
                const conf = getNotificationIcon(n.type);
                return (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => {
                      if (n.caseId) selectCase(n.caseId);
                      markNotificationAsRead(n.id);
                    }}
                    className={cn(
                      "group flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-xs outline-none transition-all duration-150 ease-out border",
                      n.read
                        ? "bg-surface/30 hover:bg-surface-raised/80 border-transparent opacity-80"
                        : "bg-surface/80 hover:bg-surface-raised border-primary/20 shadow-xs",
                      "active:scale-[0.98]",
                    )}
                  >
                    <div
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-lg border mt-0.5",
                        conf.color,
                      )}
                    >
                      {conf.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            "truncate",
                            n.read
                              ? "font-semibold text-foreground/80"
                              : "font-black text-foreground",
                          )}
                        >
                          {n.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.2 text-[9px] font-black uppercase shrink-0",
                              conf.badge,
                            )}
                          >
                            {conf.label}
                          </span>
                          {!n.read && (
                            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] font-medium text-foreground/90 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                        <span>{n.caseName ? `${n.caseName}` : ""}</span>
                        <span>{formatTime(n.timestamp)}</span>
                      </div>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
