import type { LoanCase, Role } from "@/types/loan";

export interface Scope {
  level: "company" | "region" | "area" | "branch" | "officer";
  region?: string;
  area?: string;
  branch?: string;
  officer?: string;
  label: string;
  crumbs: string[];
}

/**
 * Demo scope model. The full org hierarchy (MD → Business → Region → Area →
 * Branch → Officer) is expressed here so more roles can be added without
 * touching module components.
 */
export const DEMO_ROLES: Role[] = ["MD", "Regional Manager", "Branch Manager", "Officer"];

const SCOPES: Record<Role, Scope> = {
  MD: { level: "company", label: "Company", crumbs: ["Company"] },
  "Business Head": { level: "company", label: "Business", crumbs: ["Company", "Business"] },
  "Regional Manager": {
    level: "region",
    region: "North",
    label: "North Region",
    crumbs: ["Company", "North"],
  },
  "Area Manager": {
    level: "area",
    region: "North",
    area: "Punjab",
    label: "Punjab Area",
    crumbs: ["Company", "North", "Punjab"],
  },
  "Branch Manager": {
    level: "branch",
    region: "North",
    area: "Punjab",
    branch: "Chandigarh",
    label: "Chandigarh Branch",
    crumbs: ["Company", "North", "Punjab", "Chandigarh"],
  },
  "General Manager": { level: "company", label: "Operations", crumbs: ["Company", "Operations"] },
  Officer: {
    level: "officer",
    region: "North",
    area: "Punjab",
    branch: "Chandigarh",
    officer: "Arnav",
    label: "My book",
    crumbs: ["Company", "North", "Punjab", "Chandigarh", "Arnav"],
  },
};

export function getScope(role: Role): Scope {
  return SCOPES[role];
}

export function inScope(c: LoanCase, scope: Scope): boolean {
  if (scope.region && c.region !== scope.region) return false;
  if (scope.area && c.area !== scope.area) return false;
  if (scope.branch && c.branch !== scope.branch) return false;
  if (scope.officer && c.assignedOfficer !== scope.officer) return false;
  return true;
}

export function scopedCases(cases: LoanCase[], role: Role): LoanCase[] {
  const scope = getScope(role);
  return cases.filter((c) => inScope(c, scope));
}

/** Next drill-down dimension for management views. */
export function drillDimension(role: Role): keyof Pick<
  LoanCase,
  "region" | "area" | "branch" | "assignedOfficer"
> {
  const level = getScope(role).level;
  if (level === "company") return "region";
  if (level === "region") return "area";
  if (level === "area") return "branch";
  return "assignedOfficer";
}

export function groupBy(
  cases: LoanCase[],
  key: keyof Pick<LoanCase, "region" | "area" | "branch" | "assignedOfficer">,
): { name: string; cases: LoanCase[] }[] {
  const map = new Map<string, LoanCase[]>();
  for (const c of cases) {
    const k = String(c[key]);
    map.set(k, [...(map.get(k) ?? []), c]);
  }
  return [...map.entries()].map(([name, list]) => ({ name, cases: list }));
}
