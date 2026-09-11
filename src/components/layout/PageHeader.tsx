import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function ScopeBreadcrumb({ crumbs }: { crumbs: string[] }) {
  return (
    <nav aria-label="Scope" className="flex items-center gap-1 text-xs text-muted-foreground">
      {crumbs.map((c, i) => (
        <span key={c} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3 opacity-60" aria-hidden />}
          <span className={i === crumbs.length - 1 ? "font-semibold text-foreground" : undefined}>
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
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <ScopeBreadcrumb crumbs={crumbs} />
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
