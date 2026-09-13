import * as React from "react";
import { useState } from "react";
import {
  Crown,
  Building2,
  Landmark,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore, ROLE_PROFILES, ROLE_DEFAULT_VIEWS } from "@/store/useAppStore";
import type { Role } from "@/types/loan";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoleOption {
  role: Role;
  name: string;
  title: string;
  badge: string;
  badgeStyle: string;
  icon: React.ElementType;
  iconBg: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "MD",
    name: ROLE_PROFILES["MD"].name,
    title: "Managing Director & CEO",
    badge: "MD",
    badgeStyle: "bg-purple-500/15 text-purple-400 border-purple-500/30 dark:text-purple-300",
    icon: Crown,
    iconBg: "bg-purple-500/20 text-purple-400 ring-purple-500/30",
  },
  {
    role: "Regional Manager",
    name: ROLE_PROFILES["Regional Manager"].name,
    title: "Regional Credit Head",
    badge: "RM",
    badgeStyle: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 dark:text-cyan-300",
    icon: Building2,
    iconBg: "bg-cyan-500/20 text-cyan-400 ring-cyan-500/30",
  },
  {
    role: "Branch Manager",
    name: ROLE_PROFILES["Branch Manager"].name,
    title: "Senior Branch Manager",
    badge: "BM",
    badgeStyle: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:text-emerald-300",
    icon: Landmark,
    iconBg: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
  },
  {
    role: "Officer",
    name: ROLE_PROFILES["Officer"].name,
    title: "Senior Credit & Field Officer",
    badge: "OFFICER",
    badgeStyle: "bg-amber-500/15 text-amber-400 border-amber-500/30 dark:text-amber-300",
    icon: UserCheck,
    iconBg: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
  },
];

export function LoginPage() {
  const { login, resetData } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<Role>("Officer");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const currentOption = ROLE_OPTIONS.find((r) => r.role === selectedRole) ?? ROLE_OPTIONS[3];
  const currentProfile = ROLE_PROFILES[selectedRole];
  const CurrentIcon = currentOption.icon;

  const handleQuickSignIn = () => {
    if (isValidating) return;
    setIsValidating(true);

    setTimeout(() => {
      login(selectedRole);
      const view = ROLE_DEFAULT_VIEWS[selectedRole] ?? "EMMS";
      toast.success(`Signed in as ${currentProfile.name}`, {
        description: `${selectedRole} • ${view} workspace ready`,
      });
    }, 450);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary relative">
      {/* Subtle ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-primary/10 blur-[130px]" />
      </div>

      {/* Top Header - Compact */}
      <header className="relative z-10 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <Landmark className="size-4" aria-hidden />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-foreground">NBFC</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border/60 bg-surface/60 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Center Compact Card - Perfectly Fits Single Screen */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-4 min-h-0">
        <div className="w-full max-w-[380px]">
          <div className="rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Header / Intro */}
            <div className="text-center space-y-1">
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30 mb-0.5">
                <CurrentIcon className="size-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Sign In</h1>
              <p className="text-xs text-muted-foreground">
                Select your role to access the banking dashboard
              </p>
            </div>

            {/* Form controls - Compact & Elegant */}
            <div className="space-y-3">
              {/* Role Selection Dropdown Menu */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-foreground">Select Role</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center justify-between gap-2.5 rounded-xl border border-border bg-background/80 px-3 py-2 text-left transition-all cursor-pointer",
                        "hover:border-primary/50 hover:bg-surface-raised",
                        "focus:outline-none focus:ring-2 focus:ring-primary/40",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            "grid size-7 place-items-center rounded-md ring-1 shrink-0",
                            currentOption.iconBg,
                          )}
                        >
                          <CurrentIcon className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground leading-tight">
                            {currentOption.role}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {currentOption.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={cn(
                            "rounded-md border px-1.5 py-0.2 text-[9px] font-black uppercase",
                            currentOption.badgeStyle,
                          )}
                        >
                          {currentOption.badge}
                        </span>
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="center"
                    sideOffset={4}
                    className="w-[340px] rounded-xl border border-border bg-popover/95 backdrop-blur-2xl p-1.5 shadow-2xl z-50 space-y-0.5"
                  >
                    {ROLE_OPTIONS.map((opt) => {
                      const isSelected = selectedRole === opt.role;
                      const Icon = opt.icon;
                      return (
                        <DropdownMenuItem
                          key={opt.role}
                          onClick={() => setSelectedRole(opt.role)}
                          className={cn(
                            "flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer outline-none transition-colors",
                            isSelected
                              ? "bg-primary/15 text-primary border border-primary/25"
                              : "hover:bg-surface-raised text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={cn(
                                "grid size-7 place-items-center rounded-md ring-1 shrink-0",
                                opt.iconBg,
                              )}
                            >
                              <Icon className="size-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-tight">{opt.role}</p>
                              <p className="text-[10.5px] text-muted-foreground truncate">
                                {opt.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={cn(
                                "rounded-md border px-1.5 py-0.2 text-[9px] font-black uppercase",
                                opt.badgeStyle,
                              )}
                            >
                              {opt.badge}
                            </span>
                            {isSelected && <Check className="size-3.5 text-primary stroke-[3]" />}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Assigned User Info strip - Compact */}
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/60 text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="grid size-5 place-items-center rounded bg-primary/20 text-[9px] font-black text-primary shrink-0">
                    {currentProfile.avatarInitials}
                  </span>
                  <span className="font-semibold text-foreground truncate">
                    {currentProfile.name}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">
                  {currentProfile.scopeLabel}
                </span>
              </div>

              {/* Email Address (Auto-filled) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-bold text-foreground">Email Address</label>
                  <span className="text-[10px] text-muted-foreground font-mono">Auto-filled</span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    readOnly
                    value={currentProfile.email}
                    className="w-full rounded-lg border border-border bg-background/60 pl-8 pr-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none cursor-default"
                  />
                </div>
              </div>

              {/* Password (Auto-filled) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-bold text-foreground">Password</label>
                  <span className="text-[10px] text-emerald-400 font-mono">Auto-validated</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    readOnly
                    value="BankingSecure2026!"
                    className="w-full rounded-lg border border-border bg-background/60 pl-8 pr-8 py-1.5 text-xs font-mono text-foreground focus:outline-none cursor-default"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              {/* Quick Sign In Action Button - Compact & Punchy */}
              <button
                type="button"
                onClick={handleQuickSignIn}
                disabled={isValidating}
                className={cn(
                  "w-full rounded-xl py-2.5 px-4 text-xs font-bold transition-all duration-200 cursor-pointer shadow-md mt-1",
                  "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isValidating && "opacity-90 cursor-wait",
                )}
              >
                {isValidating ? (
                  <>
                    <span className="size-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    <span>Signing in as {selectedRole}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Quick Sign In as {selectedRole}</span>
                    <ArrowRight className="size-3.5 ml-0.5" />
                  </>
                )}
              </button>

              {/* Centered Reset Demo Data Button */}
              <div className="pt-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    resetData();
                    toast.success("Demo data reset");
                  }}
                  className="hover:text-primary transition-colors flex items-center gap-1.5 text-[10.5px] text-muted-foreground cursor-pointer"
                >
                  <RotateCcw className="size-2.5" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer - Minimal */}
      <footer className="relative z-10 w-full border-t border-border/60 bg-background/60 backdrop-blur-md py-2 text-center text-[11px] text-muted-foreground shrink-0">
        <p>© 2026 NBFC Banking Application. Secure Role-Based Access.</p>
      </footer>
    </div>
  );
}
