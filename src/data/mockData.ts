// Single source of mock records. No business data lives in components.
// Replaceable later by an API provider (see dataProvider.ts).

export type RawStage = "enquiry" | "credit_review" | "disbursement" | "collections" | "closed";

export interface EmiRecord {
  cycleMonth: string;
  paidDate: string | null;
  bounced: boolean;
}

export interface RawLoanCase {
  id: string;
  clientName: string;
  loanAmount: number;
  emiAmount: number;

  stage: RawStage;
  subStatus: string;

  region: string;
  area: string;
  branch: string;
  assignedOfficer: string;

  dueDayStart: number;
  dueDayEnd: number;
  emiHistory: EmiRecord[];

  temperature: "Hot" | "Warm" | "Cold";
  followUpCount: number;
}

export const seedData: RawLoanCase[] = [
  // --- THE HERO CASE ---
  {
    id: "CASE-001",
    clientName: "Arvind Agritech Pvt. Ltd.",
    loanAmount: 3200000,
    emiAmount: 150000,
    stage: "enquiry",
    subStatus: "New Enquiry",
    region: "North",
    area: "Punjab",
    branch: "Chandigarh",
    assignedOfficer: "Arnav",
    dueDayStart: 4,
    dueDayEnd: 9,
    emiHistory: [
      { cycleMonth: "2026-08", paidDate: "2026-08-07", bounced: true },
      { cycleMonth: "2026-09", paidDate: null, bounced: false },
    ],
    temperature: "Hot",
    followUpCount: 1,
  },

  // --- EMMS ---
  {
    id: "CASE-002",
    clientName: "Saara Enterprises",
    loanAmount: 1800000,
    emiAmount: 60000,
    stage: "enquiry",
    subStatus: "Interested",
    region: "North",
    area: "Punjab",
    branch: "Chandigarh",
    assignedOfficer: "Jatin",
    dueDayStart: 1,
    dueDayEnd: 5,
    emiHistory: [],
    temperature: "Warm",
    followUpCount: 3,
  },
  {
    id: "CASE-003",
    clientName: "VishwaBharti Traders",
    loanAmount: 500000,
    emiAmount: 15000,
    stage: "enquiry",
    subStatus: "Reached Out",
    region: "North",
    area: "Haryana",
    branch: "Jagadhri",
    assignedOfficer: "Tarun",
    dueDayStart: 10,
    dueDayEnd: 15,
    emiHistory: [],
    temperature: "Cold",
    followUpCount: 2,
  },

  // --- CREDIT REVIEW ---
  {
    id: "CASE-004",
    clientName: "Fusion Force Logistics",
    loanAmount: 8500000,
    emiAmount: 320000,
    stage: "credit_review",
    subStatus: "Review",
    region: "North",
    area: "Punjab",
    branch: "Chandigarh",
    assignedOfficer: "Shoaib",
    dueDayStart: 5,
    dueDayEnd: 10,
    emiHistory: [],
    temperature: "Hot",
    followUpCount: 4,
  },
  {
    id: "CASE-005",
    clientName: "Thinkospace Solutions",
    loanAmount: 1200000,
    emiAmount: 45000,
    stage: "credit_review",
    subStatus: "Query",
    region: "North",
    area: "Haryana",
    branch: "Jagadhri",
    assignedOfficer: "Arnav",
    dueDayStart: 1,
    dueDayEnd: 7,
    emiHistory: [],
    temperature: "Warm",
    followUpCount: 5,
  },
  {
    id: "CASE-006",
    clientName: "UniteUp Welfare Corp",
    loanAmount: 2000000,
    emiAmount: 70000,
    stage: "credit_review",
    subStatus: "Ready",
    region: "North",
    area: "Punjab",
    branch: "Sahibzada Ajit Singh Nagar",
    assignedOfficer: "Jatin",
    dueDayStart: 15,
    dueDayEnd: 20,
    emiHistory: [],
    temperature: "Hot",
    followUpCount: 2,
  },

  // --- DISBURSEMENT (AMS) ---
  {
    id: "CASE-007",
    clientName: "World Wise Imports",
    loanAmount: 12000000,
    emiAmount: 450000,
    stage: "disbursement",
    subStatus: "Verification",
    region: "North",
    area: "Punjab",
    branch: "Kharar",
    assignedOfficer: "Tarun",
    dueDayStart: 1,
    dueDayEnd: 5,
    emiHistory: [],
    temperature: "Hot",
    followUpCount: 1,
  },
  {
    id: "CASE-008",
    clientName: "GigAssure Platforms",
    loanAmount: 750000,
    emiAmount: 25000,
    stage: "disbursement",
    subStatus: "Ready",
    region: "North",
    area: "Punjab",
    branch: "Chandigarh",
    assignedOfficer: "Arnav",
    dueDayStart: 15,
    dueDayEnd: 20,
    emiHistory: [],
    temperature: "Cold",
    followUpCount: 3,
  },
  {
    id: "CASE-009",
    clientName: "GT Tech Solutions",
    loanAmount: 3000000,
    emiAmount: 95000,
    stage: "disbursement",
    subStatus: "Disbursements",
    region: "North",
    area: "Haryana",
    branch: "Yamuna Nagar",
    assignedOfficer: "Shoaib",
    dueDayStart: 10,
    dueDayEnd: 15,
    emiHistory: [],
    temperature: "Warm",
    followUpCount: 2,
  },

  // --- COLLECTIONS ---
  {
    id: "CASE-010",
    clientName: "Vikas Manufacturing",
    loanAmount: 4500000,
    emiAmount: 110000,
    stage: "collections",
    subStatus: "Follow Ups Pending",
    region: "North",
    area: "Haryana",
    branch: "Jagadhri",
    assignedOfficer: "Tarun",
    dueDayStart: 20,
    dueDayEnd: 25,
    emiHistory: [{ cycleMonth: "2026-08", paidDate: "2026-08-22", bounced: false }],
    temperature: "Hot",
    followUpCount: 8,
  },
  {
    id: "CASE-011",
    clientName: "Komal Textiles",
    loanAmount: 2200000,
    emiAmount: 75000,
    stage: "collections",
    subStatus: "Payments To Collect",
    region: "North",
    area: "Punjab",
    branch: "Chandigarh",
    assignedOfficer: "Arnav",
    dueDayStart: 1,
    dueDayEnd: 5,
    emiHistory: [{ cycleMonth: "2026-08", paidDate: "2026-08-04", bounced: false }],
    temperature: "Warm",
    followUpCount: 12,
  },
  {
    id: "CASE-012",
    clientName: "Ajitesh Retail",
    loanAmount: 900000,
    emiAmount: 35000,
    stage: "collections",
    subStatus: "Overdue",
    region: "North",
    area: "Punjab",
    branch: "Kharar",
    assignedOfficer: "Jatin",
    dueDayStart: 1,
    dueDayEnd: 1,
    emiHistory: [{ cycleMonth: "2026-08", paidDate: null, bounced: false }],
    temperature: "Cold",
    followUpCount: 15,
  },
  {
    id: "CASE-013",
    clientName: "Swami Viveka Autos",
    loanAmount: 1500000,
    emiAmount: 50000,
    stage: "collections",
    subStatus: "Follow Ups Pending",
    region: "North",
    area: "Haryana",
    branch: "Yamuna Nagar",
    assignedOfficer: "Shoaib",
    dueDayStart: 15,
    dueDayEnd: 20,
    emiHistory: [
      { cycleMonth: "2026-07", paidDate: "2026-07-18", bounced: true },
      { cycleMonth: "2026-08", paidDate: "2026-08-16", bounced: false },
    ],
    temperature: "Warm",
    followUpCount: 5,
  },
  {
    id: "CASE-014",
    clientName: "Luma Events",
    loanAmount: 600000,
    emiAmount: 20000,
    stage: "collections",
    subStatus: "Physical Visits",
    region: "North",
    area: "Punjab",
    branch: "Chandigarh",
    assignedOfficer: "Arnav",
    dueDayStart: 5,
    dueDayEnd: 10,
    emiHistory: [{ cycleMonth: "2026-08", paidDate: null, bounced: true }],
    temperature: "Hot",
    followUpCount: 7,
  },
  {
    id: "CASE-015",
    clientName: "Render Cloud Services",
    loanAmount: 5000000,
    emiAmount: 180000,
    stage: "collections",
    subStatus: "Collections Completed",
    region: "North",
    area: "Punjab",
    branch: "Sahibzada Ajit Singh Nagar",
    assignedOfficer: "Tarun",
    dueDayStart: 1,
    dueDayEnd: 5,
    emiHistory: [{ cycleMonth: "2026-09", paidDate: "2026-09-01", bounced: false }],
    temperature: "Cold",
    followUpCount: 0,
  },
];
