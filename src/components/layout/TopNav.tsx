import { Calendar, Landmark } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { ModuleView } from "@/types/loan";
import { cn } from "@/lib/utils";
import { longDate } from "@/utils/format";
import { ThemeToggle } from "./ThemeToggle";
import { UserRoleMenu } from "./UserRoleMenu";
import { NotificationMenu } from "./NotificationMenu";

const NAV: { view: ModuleView; label: string }[] = [
  { view: "EMMS", label: "Sales / EMMS" },
  { view: "Credit", label: "Credit" },
  { view: "AMS", label: "Operations" },
  { view: "Collections", label: "Collections" },
  { view: "Management", label: "Management" },
];

export function TopNav() {
  const { currentView, setView, currentDemoDate, setDemoDate } =
    useAppStore();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:px-6">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
            <Landmark className="size-4" aria-hidden />
          </span>
          <span className="text-sm font-extrabold tracking-tight text-foreground">NBFC ERP</span>
        </div>

        <nav aria-label="Modules" className="order-3 flex w-full gap-1 overflow-x-auto lg:order-none lg:w-auto">
          {NAV.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              aria-current={currentView === item.view ? "page" : undefined}
              className={cn(
                "relative shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
                currentView === item.view
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-border bg-surface/70 px-2.5 py-1.5 cursor-pointer hover:border-primary/40 hover:bg-surface-raised transition-colors">
            <Calendar className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="sr-only">Demo date</span>
            <input
              type="date"
              value={currentDemoDate}
              onChange={(e) => e.target.value && setDemoDate(e.target.value)}
              className="num bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            />
          </label>

          <ThemeToggle />

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
