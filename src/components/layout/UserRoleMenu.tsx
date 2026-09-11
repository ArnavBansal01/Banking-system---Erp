import * as React from "react";
import { Crown, Building2, Landmark, UserCheck, ChevronDown, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { DEMO_ROLES, getScope } from "@/utils/scope";
import type { Role } from "@/types/loan";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getRoleIcon(role: Role) {
  switch (role) {
    case "MD":
      return Crown;
    case "Regional Manager":
      return Building2;
    case "Branch Manager":
      return Landmark;
    case "Officer":
    default:
      return UserCheck;
  }
}

function getRoleBadgeStyle(role: Role) {
  switch (role) {
    case "MD":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30 dark:text-purple-300";
    case "Regional Manager":
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 dark:text-cyan-300";
    case "Branch Manager":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:text-emerald-300";
    case "Officer":
    default:
      return "bg-amber-500/15 text-amber-400 border-amber-500/30 dark:text-amber-300";
  }
}

function getRoleShortTag(role: Role): string {
  switch (role) {
    case "MD":
      return "MD";
    case "Regional Manager":
      return "RM";
    case "Branch Manager":
      return "BM";
    case "Officer":
      return "OFFICER";
    default:
      return String(role).toUpperCase();
  }
}

export function UserRoleMenu() {
  const { currentRole, setRole, resetData } = useAppStore();
  const scope = getScope(currentRole);
  const officerOrRoleName = scope.officer ?? currentRole;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Current Designation: ${currentRole}. Click to change.`}
          className={cn(
            "group relative flex items-center gap-2 rounded-xl border border-border/80 bg-surface/80 px-2.5 py-1.5 text-left",
            "shadow-xs transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "hover:border-primary/40 hover:bg-surface-raised hover:shadow-sm",
            "active:scale-[0.98] cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "data-[state=open]:border-primary/60 data-[state=open]:bg-surface-raised data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
          )}
        >
          {/* Avatar with initial + status dot */}
          <div className="relative flex items-center justify-center">
            <span className="grid size-7.5 place-items-center rounded-lg bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 text-[11px] font-black text-primary ring-1 ring-primary/30 transition-all group-hover:ring-primary/60">
              {initials(officerOrRoleName)}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
          </div>

          {/* User / Scope Info */}
          <div className="hidden text-left sm:block">
            <span className="block text-xs font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {officerOrRoleName}
            </span>
            <span className="block text-[10px] font-semibold leading-tight text-muted-foreground">
              {scope.label}
            </span>
          </div>

          {/* Active Role Badge Tag */}
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-2xs",
              getRoleBadgeStyle(currentRole),
            )}
          >
            {getRoleShortTag(currentRole)}
          </span>

          {/* Animated Chevron */}
          <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[state=open]:rotate-180 group-hover:text-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn(
          "z-50 w-56 overflow-hidden rounded-2xl border border-white/10 dark:border-white/10 bg-popover/90 backdrop-blur-2xl p-1.5 text-popover-foreground shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top-right",
        )}
      >
        {/* Header summary in dropdown */}
        <div className="px-2.5 py-1.5 mb-1 border-b border-border/40">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Switch Designation Scope
          </p>
        </div>

        {/* Designation Options List */}
        <div className="space-y-0.5">
          {DEMO_ROLES.map((role) => {
            const isSelected = currentRole === role;
            const RoleIcon = getRoleIcon(role);
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => setRole(role)}
                className={cn(
                  "group relative flex cursor-pointer select-none items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs outline-none font-semibold transition-all duration-150 ease-out",
                  isSelected
                    ? "bg-primary/15 text-primary border border-primary/20 shadow-2xs font-bold"
                    : "hover:bg-accent/80 hover:text-accent-foreground text-foreground active:scale-[0.97]",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <RoleIcon
                    className={cn(
                      "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isSelected
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="truncate">{role}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider",
                      isSelected
                        ? getRoleBadgeStyle(role)
                        : "border-border/50 text-muted-foreground/70 bg-muted/30",
                    )}
                  >
                    {getRoleShortTag(role)}
                  </span>
                  {isSelected && (
                    <Check className="size-3.5 stroke-[3] text-primary animate-in zoom-in-50 duration-200" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>

        <div className="my-1 border-t border-border/40" />

        <DropdownMenuItem
          onClick={() => {
            resetData();
            toast.success("Demo data reset to initial seed state");
          }}
          className="group flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive outline-none transition-all duration-150"
        >
          <RotateCcw className="size-3.5 shrink-0 transition-transform duration-200 group-hover:-rotate-90" />
          <span>Reset Demo Data</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
