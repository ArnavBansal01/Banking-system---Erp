import { seedData } from "./mockData";
import { adaptCases } from "./dataAdapter";
import type { LoanCase } from "@/types/loan";

/**
 * Stable data interface. Swap MockDataProvider for an ApiDataProvider later —
 * the store and UI do not change.
 */
export interface ERPDataProvider {
  getCases(): LoanCase[];
  getCaseById(id: string): LoanCase | undefined;
  getInitialDemoDate(): string;
}

class MockDataProvider implements ERPDataProvider {
  private cases: LoanCase[] = adaptCases(seedData);
  getCases() {
    return this.cases;
  }
  getCaseById(id: string) {
    return this.cases.find((c) => c.id === id);
  }
  getInitialDemoDate() {
    return "2026-09-02";
  }
}

export const dataProvider: ERPDataProvider = new MockDataProvider();
