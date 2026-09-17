import { Calendar } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { ModuleView } from "@/types/loan";
import { cn } from "@/lib/utils";
import { longDate } from "@/utils/format";
import { ThemeToggle } from "./ThemeToggle";
import { UserRoleMenu } from "./UserRoleMenu";
import { NotificationMenu } from "./NotificationMenu";
import { QueryCenterMenu } from "./QueryCenterMenu";

const NAV: { view: ModuleView; label: string }[] = [
  { view: "EMMS", label: "Sales / EMMS" },
  { view: "Credit", label: "Credit" },
  { view: "AMS", label: "Operations" },
  { view: "Collections", label: "Collections" },
  { view: "Management", label: "Management" },
];

export function TopNav() {
  const { currentView, setView, currentDemoDate, setDemoDate } = useAppStore();

  return (
    <header className="sticky top-0 z-40 h-[60px] border-b border-border bg-background backdrop-blur-xl">
      <div className="flex h-full items-center gap-x-4 gap-y-2 px-4 lg:px-6">
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-surface border border-border shadow-xs shrink-0 overflow-hidden">
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

        {/* Module navigation */}
        <nav
          aria-label="Modules"
          className="hidden lg:flex items-center gap-0.5 rounded-lg bg-muted/60 p-1"
        >
          {NAV.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              aria-current={currentView === item.view ? "page" : undefined}
              className={cn(
                "relative shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                currentView === item.view
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60",
              )}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile module navigation (scrollable) */}
        <nav
          aria-label="Modules mobile"
          className="flex lg:hidden w-full gap-1 overflow-x-auto"
        >
          {NAV.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              aria-current={currentView === item.view ? "page" : undefined}
              className={cn(
                "relative shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                currentView === item.view
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* System Date */}
          <label
            title="System Date"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 cursor-pointer hover:border-primary/40 hover:bg-surface-raised transition-colors"
          >
            <Calendar className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="sr-only">System date</span>
            <input
              type="date"
              value={currentDemoDate}
              onChange={(e) => e.target.value && setDemoDate(e.target.value)}
              className="num bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            />
          </label>

          <ThemeToggle />

          {/* Queries Center Panel */}
          <QueryCenterMenu />

          {/* Notification Panel Dropdown */}
          <NotificationMenu />

          {/* Profile & Designation Selector Dropdown */}
          <UserRoleMenu />
        </div>
      </div>
      <p className="sr-only">Demo date {longDate(currentDemoDate)}</p>
    </header>
  );
}
