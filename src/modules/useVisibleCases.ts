import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { scopedCases } from "@/utils/scope";
import type { LoanCase } from "@/types/loan";

/** Scope + search + filters applied centrally so modules never re-derive them. */
export function useVisibleCases(): LoanCase[] {
  const { cases, currentRole, search, filterPriority } = useAppStore();
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedCases(cases, currentRole).filter((c) => {
      if (filterPriority !== "all" && c.priority !== filterPriority) return false;
      if (!q) return true;
      return (
        c.clientName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.applicant.contact.includes(q) ||
        c.assignedOfficer.toLowerCase().includes(q)
      );
    });
  }, [cases, currentRole, search, filterPriority]);
}
