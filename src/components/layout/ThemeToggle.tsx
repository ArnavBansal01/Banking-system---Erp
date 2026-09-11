import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";
const KEY = "nbfc-erp-theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const initial: Theme = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(initial);
    apply(initial);
  }, []);

  const change = (next: Theme) => {
    setTheme(next);
    apply(next);
    localStorage.setItem(KEY, next);
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-lg border border-border bg-surface/70 p-0.5"
    >
      {[
        { value: "dark" as Theme, label: "Dark theme", Icon: Moon },
        { value: "light" as Theme, label: "Light theme", Icon: Sun },
      ].map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => change(value)}
          aria-label={label}
          aria-pressed={theme === value}
          title={label}
          className={cn(
            "grid size-7 place-items-center rounded-md transition-colors cursor-pointer",
            theme === value
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </button>
      ))}
    </div>
  );
}
