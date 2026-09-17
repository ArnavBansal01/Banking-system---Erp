"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";
const KEY = "nbfc-erp-theme";

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const syncTheme = () => {
      try {
        const stored = localStorage.getItem(KEY);
        const current: Theme =
          stored === "light" || stored === "dark"
            ? stored
            : document.documentElement.classList.contains("light")
            ? "light"
            : "dark";
        setTheme(current);
        apply(current);
      } catch {
        // Local storage unavailable
      }
    };

    syncTheme();
    window.addEventListener("nbfc-theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("nbfc-theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const change = (next: Theme) => {
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem(KEY, next);
      window.dispatchEvent(new CustomEvent("nbfc-theme-change", { detail: next }));
    } catch {
      // Local storage unavailable
    }
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "flex items-center gap-0.5 rounded-lg border border-border bg-surface/70 p-0.5",
        className,
      )}
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
