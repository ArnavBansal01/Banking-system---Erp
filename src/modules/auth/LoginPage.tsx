"use client";
import * as React from "react";
import { useState } from "react";
import {
  Crown,
  Building2,
  Landmark,
  UserCheck,
  Briefcase,
  Layers,
  Sliders,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore, ROLE_PROFILES, ROLE_DEFAULT_VIEWS } from "@/store/useAppStore";
import type { Role } from "@/types/loan";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PoweredByGlamarode } from "@/components/layout/PoweredByGlamarode";
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
    role: "Officer",
    name: ROLE_PROFILES["Officer"].name,
    title: "Senior Credit & Field Officer",
    badge: "OFFICER",
    badgeStyle: "bg-amber-500/15 text-amber-400 border-amber-500/30 dark:text-amber-300",
    icon: UserCheck,
    iconBg: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
  },
  {
    role: "Branch Manager",
    name: ROLE_PROFILES["Branch Manager"].name,
    title: "Branch Approver & Hub Lead",
    badge: "BM",
    badgeStyle: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:text-emerald-300",
    icon: Landmark,
    iconBg: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
  },
  {
    role: "Area Manager",
    name: ROLE_PROFILES["Area Manager"].name,
    title: "Area Operations Lead",
    badge: "AM",
    badgeStyle: "bg-blue-500/15 text-blue-400 border-blue-500/30 dark:text-blue-300",
    icon: Layers,
    iconBg: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
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
    role: "General Manager",
    name: ROLE_PROFILES["General Manager"].name,
    title: "General Manager — Operations",
    badge: "GM",
    badgeStyle: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 dark:text-indigo-300",
    icon: Sliders,
    iconBg: "bg-indigo-500/20 text-indigo-400 ring-indigo-500/30",
  },
  {
    role: "Business Head",
    name: ROLE_PROFILES["Business Head"].name,
    title: "Head of Retail Lending",
    badge: "BH",
    badgeStyle: "bg-orange-500/15 text-orange-400 border-orange-500/30 dark:text-orange-300",
    icon: Briefcase,
    iconBg: "bg-orange-500/20 text-orange-400 ring-orange-500/30",
  },
  {
    role: "MD",
    name: ROLE_PROFILES["MD"].name,
    title: "Managing Director & CEO",
    badge: "MD",
    badgeStyle: "bg-purple-500/15 text-purple-400 border-purple-500/30 dark:text-purple-300",
    icon: Crown,
    iconBg: "bg-purple-500/20 text-purple-400 ring-purple-500/30",
  },
];

interface LoginPageProps {
  onBackToHome?: () => void;
}

export function LoginPage({ onBackToHome }: LoginPageProps = {}) {
  const { login } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<Role>("Officer");
  const [email, setEmail] = useState<string>(ROLE_PROFILES["Officer"].email);
  const [password, setPassword] = useState<string>("pass123");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const currentOption: RoleOption =
    ROLE_OPTIONS.find((r) => r.role === selectedRole) ?? (ROLE_OPTIONS[0] as RoleOption);
  const currentProfile = ROLE_PROFILES[selectedRole];
  const CurrentIcon = currentOption.icon;

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setEmail(
      ROLE_PROFILES[role]?.email ?? `${role.toLowerCase().replace(/\s+/g, ".")}@cassmart.in`,
    );
  };

  const handleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isValidating) return;
    setIsValidating(true);

    setTimeout(() => {
      login(selectedRole, email);
      const view = ROLE_DEFAULT_VIEWS[selectedRole] ?? "EMMS";
      toast.success(`Signed in as ${currentProfile.name}`, {
        description: `${selectedRole} • ${view} workspace active`,
      });
      setIsValidating(false);
    }, 300);
  };

  return (
    <div
      className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary relative"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-primary/8 blur-[120px]" />
      </div>

      {/* Top Header — 60px matching Landing Page */}
      <header className="relative z-10 h-[60px] w-full border-b border-border bg-background shrink-0">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div
            onClick={onBackToHome}
            role={onBackToHome ? "button" : undefined}
            tabIndex={onBackToHome ? 0 : undefined}
            onKeyDown={(e) => {
              if (onBackToHome && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onBackToHome();
              }
            }}
            className={cn(
              "flex items-center gap-2.5 shrink-0",
              onBackToHome && "cursor-pointer hover:opacity-85 transition-opacity",
            )}
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-surface border border-border shadow-xs overflow-hidden">
              <img
                src="/image.png"
                alt="Cassmart Logo"
                className="size-8 object-cover rounded-full"
              />
            </div>
            <span
              className="text-sm font-bold tracking-tight text-foreground"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Cassmart
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised hover:border-primary/40 transition-all cursor-pointer"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                ← Back to Home
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Center Sign In Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 min-h-0">
        <div className="w-full max-w-[400px]">
          {/* Card — solid surface, no glassmorphism, matching reference onboardingModalCard */}
          <div className="rounded-2xl border border-border bg-card p-7 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.40)] space-y-5">
            {/* Header / Logo */}
            <div className="text-center space-y-2 pb-4 border-b border-border">
              <div className="inline-flex size-14 mx-auto items-center justify-center rounded-full bg-surface border border-border shadow-sm overflow-hidden">
                <img
                  src="/image.png"
                  alt="Cassmart Logo"
                  className="size-14 object-cover rounded-full"
                />
              </div>
              <div>
                <h1
                  className="text-xl text-foreground"
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 300,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Sign In
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontWeight: 300 }}>
                  Select your role and enter your credentials
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Role Selection Dropdown */}
              <div className="space-y-1.5">
                <label
                  className="block text-[11px] font-semibold text-foreground"
                  style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  Designated Role
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center justify-between gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-all cursor-pointer",
                        "hover:border-primary/50 hover:bg-surface-raised",
                        "focus:outline-none focus:ring-1 focus:ring-primary/40",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            "grid size-7 place-items-center rounded-lg ring-1 shrink-0",
                            currentOption.iconBg,
                          )}
                        >
                          <CurrentIcon className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground leading-tight">
                            {currentOption.role}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate" style={{ fontWeight: 300 }}>
                            {currentOption.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase",
                            currentOption.badgeStyle,
                          )}
                          style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.04em" }}
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
                    className="w-[360px] max-h-[300px] overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.4)] z-50 space-y-0.5"
                  >
                    {ROLE_OPTIONS.map((opt) => {
                      const isSelected = selectedRole === opt.role;
                      const Icon = opt.icon;
                      return (
                        <DropdownMenuItem
                          key={opt.role}
                          onClick={() => handleRoleSelect(opt.role)}
                          className={cn(
                            "flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer outline-none transition-colors",
                            isSelected
                              ? "bg-primary/12 text-primary border border-primary/20"
                              : "hover:bg-surface-raised text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={cn(
                                "grid size-7 place-items-center rounded-lg ring-1 shrink-0",
                                opt.iconBg,
                              )}
                            >
                              <Icon className="size-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold leading-tight">{opt.role}</p>
                              <p className="text-[10.5px] text-muted-foreground truncate" style={{ fontWeight: 300 }}>
                                {opt.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={cn(
                                "rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                opt.badgeStyle,
                              )}
                              style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.04em" }}
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

              {/* Assigned User Info strip */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface border border-border/60 text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="grid size-5 place-items-center rounded-md bg-primary/20 text-[9px] font-bold text-primary shrink-0">
                    {currentProfile.avatarInitials}
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {currentProfile.name}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate" style={{ fontWeight: 300 }}>
                  {currentProfile.scopeLabel}
                </span>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  className="block text-[11px] font-semibold text-foreground"
                  style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-2 text-xs font-mono text-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  className="block text-[11px] font-semibold text-foreground"
                  style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-border bg-background pl-8 pr-9 py-2 text-xs font-mono text-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
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

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isValidating}
                className={cn(
                  "w-full rounded-xl py-2.5 px-4 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-md mt-1",
                  "bg-primary text-primary-foreground hover:brightness-108 active:scale-[0.99] flex items-center justify-center gap-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isValidating && "opacity-90 cursor-wait",
                )}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {isValidating ? (
                  <>
                    <span className="size-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    <span>Signing in as {selectedRole}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Sign In as {selectedRole}</span>
                    <ArrowRight className="size-3.5 ml-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 h-[52px] w-full border-t border-border bg-background flex items-center justify-between px-6 text-[11px] text-muted-foreground shrink-0">
        <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300 }}>
          © 2026 Cassmart Micro Foundations. Persistent Session &amp; Role-Based Access.
        </p>
        <PoweredByGlamarode variant="oval" />
      </footer>
    </div>
  );
}
