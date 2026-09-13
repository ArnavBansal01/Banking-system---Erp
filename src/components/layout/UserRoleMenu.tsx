import * as React from "react";
import { ChevronDown, RotateCcw, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { getScope } from "@/utils/scope";
import type { Role } from "@/types/loan";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { currentRole, currentUser, logout, resetData } = useAppStore();
  const scope = getScope(currentRole);
  const displayName = currentUser?.name ?? scope.officer ?? currentRole;
  const userInitials = currentUser?.avatarInitials ?? initials(displayName);
  const userEmail =
    currentUser?.email ?? `${currentRole.toLowerCase().replace(/\s+/g, ".")}@nbfc-finance.in`;
  const userDesignation = currentUser?.designation ?? currentRole;

  const handleLogout = () => {
    logout();
    toast.info("Signed out. Please select a role to sign in.");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Logged in as ${displayName} (${currentRole}). Open profile menu.`}
          className={cn(
            "group relative flex items-center gap-2 rounded-xl border border-border/80 bg-surface/80 px-2.5 py-1.5 text-left",
            "shadow-xs transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "hover:border-primary/40 hover:bg-surface-raised hover:shadow-sm",
            "active:scale-[0.98] cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "data-[state=open]:border-primary/60 data-[state=open]:bg-surface-raised data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
          )}
        >
          {/* Avatar with initial + online dot */}
          <div className="relative flex items-center justify-center">
            <span className="grid size-7.5 place-items-center rounded-lg bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 text-[11px] font-black text-primary ring-1 ring-primary/30 transition-all group-hover:ring-primary/60">
              {userInitials}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
          </div>

          {/* User / Scope Info */}
          <div className="hidden text-left sm:block">
            <span className="block text-xs font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {displayName}
            </span>
            <span className="block text-[10px] font-semibold leading-tight text-muted-foreground">
              {scope?.label ?? "Active"}
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
          "z-50 w-64 overflow-hidden rounded-2xl border border-white/10 dark:border-white/10 bg-popover/95 backdrop-blur-2xl p-2 text-popover-foreground shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top-right",
        )}
      >
        {/* User Identity Header */}
        <div className="rounded-xl bg-surface/80 p-3 border border-border/50">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/20 text-xs font-black text-primary ring-1 ring-primary/40 shrink-0">
              {userInitials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground font-mono">{userEmail}</p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-1.5 pt-2 border-t border-border/40 text-[10px]">
            <span className="text-muted-foreground truncate">{userDesignation}</span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.2 font-extrabold uppercase tracking-wider text-[9px]",
                getRoleBadgeStyle(currentRole),
              )}
            >
              {getRoleShortTag(currentRole)}
            </span>
          </div>
        </div>

        {/* Security / Session status indicator */}
        <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 text-[11px] font-medium">
          <ShieldCheck className="size-3.5 shrink-0" />
          <span className="truncate text-[10.5px]">Authenticated Session • AES-256</span>
        </div>

        <DropdownMenuSeparator className="my-1.5 bg-border/40" />

        {/* Action: Reset Demo Data */}
        <DropdownMenuItem
          onClick={() => {
            resetData();
            toast.success("Demo data reset to initial seed state");
          }}
          className="group flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive outline-none transition-colors"
        >
          <RotateCcw className="size-3.5 shrink-0 transition-transform duration-200 group-hover:-rotate-90" />
          <span>Reset Demo Data</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-border/40" />

        {/* Action: Sign Out / Switch Role */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="group flex cursor-pointer select-none items-center justify-between rounded-xl px-2.5 py-2.5 text-xs font-bold text-foreground hover:bg-primary/15 hover:text-primary outline-none transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="size-4 text-primary shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            <div className="text-left">
              <p className="leading-tight">Sign Out / Switch Role</p>
              <p className="text-[10px] font-normal text-muted-foreground">
                Return to Role Login portal
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-primary opacity-80 group-hover:opacity-100">
            Exit →
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
