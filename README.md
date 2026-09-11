# NBFC Enterprise Resource Planning (ERP)

A unified Enterprise NBFC platform for managing the end-to-end loan lifecycle — covering enquiry, credit evaluation, operations, disbursement, and collections in a connected workflow.

## Overview

This system provides institutional loan lifecycle management:
- **Lead & Enquiry Management**: Lead capture, applicant profiling, and initial verification.
- **Credit Underwriting**: Financial assessment, ratio calculations, risk profiling, and decision engine.
- **Operations & Documentation**: Document verification, sanctions, and pre-disbursement compliance.
- **Disbursement & Accounting**: Fund release scheduling, split disbursements, and repayment schedule generation.
- **Collections & EMMS**: Delinquency tracking, recovery workflows, and portfolio analytics.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) with TanStack Router
- **UI Library**: [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com)
- **Component Primitives**: [Radix UI](https://www.radix-ui.com) & [shadcn/ui](https://ui.shadcn.com)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs) & [TanStack Query](https://tanstack.com/query)
- **Form Management**: React Hook Form with Zod validation
- **Build Tool**: Vite 8 & TypeScript 5

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

The application will start on `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```
