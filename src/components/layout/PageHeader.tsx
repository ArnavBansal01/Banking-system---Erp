"use client";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function ScopeBreadcrumb({ crumbs }: { crumbs: string[] }) {
  return (
    <nav aria-label="Scope" className="flex items-center gap-1">
      {crumbs.map((c, i) => (
        <span key={c} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3 text-muted-foreground/50" aria-hidden />}
          <span
            className={
              i === crumbs.length - 1
                ? "text-[11px] font-600 text-foreground"
                : "text-[11px] text-muted-foreground"
            }
            style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.04em" }}
          >
            {c}
          </span>
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  subtitle,
  crumbs,
  actions,
}: {
  title: string;
  subtitle: string;
  crumbs: string[];
  actions?: ReactNode | undefined;
}) {
  return (
    <div className="pb-4 mb-1 border-b border-border">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <ScopeBreadcrumb crumbs={crumbs} />
          <h1
            className="mt-1 text-[1.75rem] leading-tight text-foreground"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 300,
              letterSpacing: "-0.025em",
            }}
          >
            {title}
          </h1>
          <p
            className="mt-0.5 text-[13px] text-muted-foreground"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300 }}
          >
            {subtitle}
          </p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
