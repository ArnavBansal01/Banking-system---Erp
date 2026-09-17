"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  FileCheck,
  Landmark,
  Lock,
  Phone,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  User,
  IndianRupee,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createNewEnquiry } from "@/lib/api";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LandingPageProps {
  onLoginClick: () => void;
}

interface EnquiryForm {
  // Step 1 — Identity
  fullName: string;
  mobile: string;
  aadhaar: string;
  // Step 2 — Business
  businessName: string;
  entityType: string;
  pan: string;
  // Step 3 — Loan
  loanAmount: string;
  tenureMonths: string;
  purpose: string;
}

const ENTITY_TYPES = [
  "Proprietorship",
  "Partnership",
  "Private Limited",
  "Public Limited",
  "LLP",
  "Other",
];

const PURPOSES = [
  "Working capital",
  "Equipment purchase",
  "Business expansion",
  "Raw material procurement",
  "Inventory financing",
  "Office renovation",
  "Other",
];

const STEP_META = [
  { num: 1, label: "Identity" },
  { num: 2, label: "Business & PAN" },
  { num: 3, label: "Loan Details" },
  { num: 4, label: "Confirm" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(val: string): string {
  const n = Number(val.replace(/,/g, ""));
  if (isNaN(n) || !val) return "";
  return n.toLocaleString("en-IN");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-[11px] font-semibold uppercase tracking-wider text-foreground/80 mb-1.5"
      style={{ fontFamily: "Space Grotesk, sans-serif" }}
    >
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "w-full rounded-xl border border-border bg-background py-2.5 text-sm text-foreground transition-colors",
          "focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30",
          icon ? "pl-9 pr-3" : "px-3",
        )}
        style={{ fontFamily: "Poppins, sans-serif" }}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl border border-border bg-background py-2.5 text-sm text-foreground transition-colors appearance-none",
          "focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30",
          icon ? "pl-9 pr-8" : "px-3 pr-8",
        )}
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 rotate-90 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedId, setSubmittedId] = useState("");

  const [form, setForm] = useState<EnquiryForm>({
    fullName: "",
    mobile: "",
    aadhaar: "",
    businessName: "",
    entityType: "Proprietorship",
    pan: "",
    loanAmount: "",
    tenureMonths: "24",
    purpose: "Working capital",
  });

  const patch = (fields: Partial<EnquiryForm>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const openModal = (step = 1) => {
    setActiveStep(step);
    setSubmitted(false);
    setSubmitError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setSubmitError("");
      setActiveStep(1);
    }, 300);
  };

  // Validation per step
  const canProceed = (): boolean => {
    if (activeStep === 1)
      return (
        form.fullName.trim().length >= 2 && form.mobile.trim().length === 10
      );
    if (activeStep === 2)
      return (
        form.businessName.trim().length >= 2 &&
        form.pan.trim().length === 10
      );
    if (activeStep === 3)
      return (
        Number(form.loanAmount.replace(/,/g, "")) > 0 &&
        Number(form.tenureMonths) > 0
      );
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const amount = Number(form.loanAmount.replace(/,/g, "")) || 0;
      const tenure = Number(form.tenureMonths) || 24;
      const purposeStr = `${form.purpose} | Entity: ${form.entityType} | Business: ${form.businessName} | PAN: ${form.pan} | Aadhaar: ${form.aadhaar}`;

      const record = await createNewEnquiry({
        name: form.fullName.trim(),
        phone: form.mobile.trim(),
        amount,
        emi_amount: Math.round(amount / tenure),
        purpose: purposeStr,
        loan_type: "Business",
        tenure_in_months: tenure,
      });

      setSubmittedId((record as { id: string }).id ?? "");
      setSubmitted(true);
    } catch (err) {
      setSubmitError((err as Error).message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const emiEstimate =
    Number(form.loanAmount.replace(/,/g, "")) > 0 && Number(form.tenureMonths) > 0
      ? Math.round(Number(form.loanAmount.replace(/,/g, "")) / Number(form.tenureMonths))
      : 0;

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* ── Top Header — 60px matching Login Page ───────────────────── */}
      <header className="sticky top-0 z-40 h-[60px] w-full border-b border-border bg-background shrink-0">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex size-8 items-center justify-center rounded-full bg-surface border border-border shadow-xs overflow-hidden">
              <img
                src="/image.png"
                alt="Cassmart Logo"
                className="size-8 object-cover rounded-full"
              />
            </div>
            <span
              className="text-sm font-bold tracking-tight text-foreground"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Cassmart
            </span>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => openModal(1)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised hover:border-primary/40 transition-all cursor-pointer"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Apply for a Loan
            </button>
            <button
              type="button"
              onClick={onLoginClick}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <Lock className="size-3.5" />
              Staff Login
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-20 pb-16">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-primary/6 blur-[140px]" />
        </div>

        {/* Badge */}
        <div
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary"
          style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.04em" }}
        >
          <Sparkles className="size-3" />
          Quick Business Loans
        </div>

        {/* Headline */}
        <h1
          className="max-w-2xl text-4xl sm:text-5xl lg:text-6xl text-foreground mb-4 leading-tight"
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 300,
            letterSpacing: "-0.03em",
          }}
        >
          Business loans,{" "}
          <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent font-medium">
            made simple.
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          className="max-w-xl text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed"
          style={{ fontWeight: 300 }}
        >
          Borrow up to ₹50 Lakhs with zero paperwork and clear, transparent
          terms. Check your eligible offer in just 2 minutes.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-10">
          <button
            type="button"
            onClick={() => openModal(1)}
            className="flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Apply for a Loan
            <ArrowRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={onLoginClick}
            className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-7 py-3.5 text-sm font-medium text-foreground hover:bg-surface-raised hover:border-primary/40 transition-all cursor-pointer"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <Lock className="size-4 text-muted-foreground" />
            Staff / Officer Login
          </button>
        </div>

        {/* Helper note */}
        <p className="text-xs text-muted-foreground flex items-center gap-1.5" style={{ fontWeight: 300 }}>
          <span className="size-1.5 rounded-full bg-success inline-block animate-pulse" />
          Takes 2 minutes &nbsp;•&nbsp; Won&apos;t affect your credit score
        </p>

        {/* Trust row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Landmark className="size-3.5 text-primary" />
            <span>RBI Regulated NBFC</span>
          </div>
          <span className="text-border-strong hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-success" />
            <span>Zero Paperwork</span>
          </div>
          <span className="text-border-strong hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <BadgeCheck className="size-3.5 text-review" />
            <span>Instant Approval Letter</span>
          </div>
          <span className="text-border-strong hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-info" />
            <span>100% Safe &amp; Private</span>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-surface/50 border-t border-border">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <span
              className="inline-block mb-3 text-[11px] font-semibold uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              How It Works
            </span>
            <h2
              className="text-2xl sm:text-3xl text-foreground mb-3"
              style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 300,
                letterSpacing: "-0.02em",
              }}
            >
              Four simple steps to your loan
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontWeight: 300 }}>
              Click any step below to begin your loan application right now.
            </p>
          </div>

          {/* Step cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                icon: <Phone className="size-5" />,
                title: "Phone & Aadhaar",
                desc: "Quick mobile verification with your Aadhaar number. Takes 30 seconds.",
                goto: 1,
              },
              {
                step: "02",
                icon: <CreditCard className="size-5" />,
                title: "Business & PAN",
                desc: "Instant confirmation of your business and tax details. No document uploads.",
                goto: 2,
              },
              {
                step: "03",
                icon: <Sparkles className="size-5" />,
                title: "Loan Details",
                desc: "Tell us how much you need and for how long. We calculate your EMI instantly.",
                goto: 3,
              },
              {
                step: "04",
                icon: <FileCheck className="size-5" />,
                title: "Get Approval",
                desc: "Review your application summary and submit. Our team contacts you within 24 hours.",
                goto: 4,
              },
            ].map(({ step, icon, title, desc, goto }) => (
              <button
                key={step}
                type="button"
                onClick={() => openModal(goto === 4 ? 1 : goto)}
                className="group text-left rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-card transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[10px] font-bold text-primary/70 tracking-widest"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    STEP {step}
                  </span>
                  <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    {icon}
                  </div>
                </div>
                <h3
                  className="text-sm font-semibold text-foreground mb-2"
                  style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.01em" }}
                >
                  {title}
                </h3>
                <p
                  className="text-xs text-muted-foreground leading-relaxed mb-4"
                  style={{ fontWeight: 300 }}
                >
                  {desc}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2.5 transition-all">
                  <span>Start here</span>
                  <ArrowRight className="size-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="h-[52px] border-t border-border bg-background flex items-center justify-center px-6">
        <p
          className="text-[11px] text-muted-foreground text-center"
          style={{ fontWeight: 300 }}
        >
          © 2026 Cassmart Micro Foundations &nbsp;•&nbsp; Licensed Non-Banking Financial Company (NBFC-ICC) &nbsp;•&nbsp; RBI Registration No. B-05.04.05.00007
        </p>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          Enquiry Modal
      ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Loan Application"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-[480px] rounded-2xl border border-border bg-card shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Modal top bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface/60">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full size-2 bg-primary" />
                </span>
                <span
                  className="text-[11px] font-semibold text-primary/80 tracking-widest uppercase"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Cassmart Loan Application
                </span>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Stepper */}
            {!submitted && (
              <div className="flex items-center px-5 py-3 border-b border-border gap-1.5 overflow-x-auto">
                {STEP_META.map((s, idx) => (
                  <React.Fragment key={s.num}>
                    <button
                      type="button"
                      onClick={() => activeStep > s.num && setActiveStep(s.num)}
                      className={cn(
                        "flex items-center gap-1.5 shrink-0 cursor-default",
                        activeStep > s.num && "cursor-pointer",
                      )}
                    >
                      <div
                        className={cn(
                          "size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors border",
                          activeStep > s.num
                            ? "bg-success border-success text-success-foreground"
                            : activeStep === s.num
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-surface border-border text-muted-foreground",
                        )}
                        style={{ fontFamily: "Space Grotesk, sans-serif" }}
                      >
                        {activeStep > s.num ? "✓" : s.num}
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-medium hidden sm:block",
                          activeStep === s.num
                            ? "text-primary"
                            : activeStep > s.num
                              ? "text-success"
                              : "text-muted-foreground",
                        )}
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {s.label}
                      </span>
                    </button>
                    {idx < STEP_META.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-px min-w-[16px] transition-colors",
                          activeStep > s.num ? "bg-success/40" : "bg-border",
                        )}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Step content */}
            <div className="px-5 py-5 space-y-4">

              {/* ── STEP 1: Identity ── */}
              {activeStep === 1 && !submitted && (
                <>
                  <div>
                    <h3
                      className="text-base font-medium text-foreground mb-0.5"
                      style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}
                    >
                      Your Identity
                    </h3>
                    <p className="text-xs text-muted-foreground" style={{ fontWeight: 300 }}>
                      Enter your personal details to get started.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>Full Name *</FieldLabel>
                      <TextInput
                        value={form.fullName}
                        onChange={(v) => patch({ fullName: v })}
                        placeholder="e.g. Rajesh Kumar Verma"
                        icon={<User className="size-3.5" />}
                      />
                    </div>
                    <div>
                      <FieldLabel>Mobile Number *</FieldLabel>
                      <TextInput
                        value={form.mobile}
                        onChange={(v) => patch({ mobile: v.replace(/\D/g, "").slice(0, 10) })}
                        placeholder="10-digit mobile number"
                        type="tel"
                        maxLength={10}
                        icon={<Phone className="size-3.5" />}
                      />
                    </div>
                    <div>
                      <FieldLabel>Aadhaar Number</FieldLabel>
                      <TextInput
                        value={form.aadhaar}
                        onChange={(v) => patch({ aadhaar: v.replace(/\D/g, "").slice(0, 12) })}
                        placeholder="12-digit Aadhaar number"
                        maxLength={12}
                        icon={<ShieldCheck className="size-3.5" />}
                      />
                      
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 2: Business & PAN ── */}
              {activeStep === 2 && !submitted && (
                <>
                  <div>
                    <h3
                      className="text-base font-medium text-foreground mb-0.5"
                      style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}
                    >
                      Business Details
                    </h3>
                    <p className="text-xs text-muted-foreground" style={{ fontWeight: 300 }}>
                      Tell us about your business entity and tax ID.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>Business / Entity Name *</FieldLabel>
                      <TextInput
                        value={form.businessName}
                        onChange={(v) => patch({ businessName: v })}
                        placeholder="e.g. Verma Engineering Works"
                        icon={<Building2 className="size-3.5" />}
                      />
                    </div>
                    <div>
                      <FieldLabel>Entity Type</FieldLabel>
                      <SelectInput
                        value={form.entityType}
                        onChange={(v) => patch({ entityType: v })}
                        options={ENTITY_TYPES}
                        icon={<Building2 className="size-3.5" />}
                      />
                    </div>
                    <div>
                      <FieldLabel>PAN Number *</FieldLabel>
                      <TextInput
                        value={form.pan.toUpperCase()}
                        onChange={(v) =>
                          patch({ pan: v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })
                        }
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        icon={<CreditCard className="size-3.5" />}
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground" style={{ fontWeight: 300 }}>
                        10-character PAN as on your tax card.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 3: Loan Details ── */}
              {activeStep === 3 && !submitted && (
                <>
                  <div>
                    <h3
                      className="text-base font-medium text-foreground mb-0.5"
                      style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}
                    >
                      Loan Requirements
                    </h3>
                    <p className="text-xs text-muted-foreground" style={{ fontWeight: 300 }}>
                      How much do you need and for how long?
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>Loan Amount (₹) *</FieldLabel>
                      <TextInput
                        value={form.loanAmount}
                        onChange={(v) => patch({ loanAmount: v.replace(/[^0-9]/g, "") })}
                        placeholder="e.g. 2500000"
                        icon={<IndianRupee className="size-3.5" />}
                      />
                      {form.loanAmount && (
                        <p className="mt-1 text-[11px] text-primary font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          ₹ {formatINR(form.loanAmount)}
                        </p>
                      )}
                    </div>
                    <div>
                      <FieldLabel>Repayment Tenure *</FieldLabel>
                      <SelectInput
                        value={form.tenureMonths}
                        onChange={(v) => patch({ tenureMonths: v })}
                        options={["12", "18", "24", "36", "48", "60"]}
                        icon={<FileCheck className="size-3.5" />}
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground" style={{ fontWeight: 300 }}>
                        Months
                      </p>
                    </div>
                    <div>
                      <FieldLabel>Loan Purpose</FieldLabel>
                      <SelectInput
                        value={form.purpose}
                        onChange={(v) => patch({ purpose: v })}
                        options={PURPOSES}
                      />
                    </div>
                    {emiEstimate > 0 && (
                      <div className="rounded-xl border border-primary/20 bg-primary/8 px-4 py-3">
                        <p className="text-[11px] text-primary/70 mb-0.5" style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.04em" }}>
                          ESTIMATED MONTHLY EMI
                        </p>
                        <p
                          className="text-2xl font-semibold text-primary"
                          style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                          ₹ {emiEstimate.toLocaleString("en-IN")}
                          <span className="text-xs font-normal text-muted-foreground ml-2">/month</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5" style={{ fontWeight: 300 }}>
                          Indicative only. Final EMI is subject to credit assessment.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── STEP 4: Confirm & Submit ── */}
              {activeStep === 4 && !submitted && (
                <>
                  <div>
                    <h3
                      className="text-base font-medium text-foreground mb-0.5"
                      style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}
                    >
                      Review &amp; Submit
                    </h3>
                    <p className="text-xs text-muted-foreground" style={{ fontWeight: 300 }}>
                      Confirm your details before sending the enquiry.
                    </p>
                  </div>

                  {/* Summary card */}
                  <div className="rounded-xl border border-border bg-surface divide-y divide-border text-sm">
                    {[
                      { label: "Name", value: form.fullName },
                      { label: "Mobile", value: form.mobile },
                      { label: "Aadhaar", value: form.aadhaar || "—" },
                      { label: "Business", value: form.businessName },
                      { label: "Entity Type", value: form.entityType },
                      { label: "PAN", value: form.pan || "—" },
                      {
                        label: "Loan Amount",
                        value: `₹ ${formatINR(form.loanAmount)}`,
                      },
                      { label: "Tenure", value: `${form.tenureMonths} months` },
                      { label: "Purpose", value: form.purpose },
                      {
                        label: "Est. EMI",
                        value: emiEstimate ? `₹ ${emiEstimate.toLocaleString("en-IN")} /month` : "—",
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between px-3.5 py-2">
                        <span
                          className="text-[11px] text-muted-foreground"
                          style={{ fontFamily: "Space Grotesk, sans-serif" }}
                        >
                          {label}
                        </span>
                        <span className="text-xs font-medium text-foreground max-w-[55%] text-right">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {submitError && (
                    <p className="text-xs text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                      {submitError}
                    </p>
                  )}

                  <p className="text-[11px] text-muted-foreground" style={{ fontWeight: 300 }}>
                    By submitting, you consent to Cassmart contacting you regarding your loan enquiry. This will not affect your credit score.
                  </p>
                </>
              )}

              {/* ── SUCCESS STATE ── */}
              {submitted && (
                <div className="py-6 flex flex-col items-center text-center gap-3">
                  <div className="size-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
                    <CheckCircle2 className="size-8 text-success" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-medium text-foreground mb-1"
                      style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}
                    >
                      Enquiry Submitted!
                    </h3>
                    <p className="text-xs text-muted-foreground" style={{ fontWeight: 300 }}>
                      Your loan enquiry has been registered. Our team will reach out to <span className="text-foreground font-medium">{form.mobile}</span> within 24 hours.
                    </p>
                    {submittedId && (
                      <p
                        className="mt-2 text-[11px] text-muted-foreground font-mono"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        Reference: <span className="text-primary">{submittedId}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-xs font-medium text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={onLoginClick}
                      className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Lock className="size-3.5" />
                      Go to Staff Login
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer / nav buttons */}
            {!submitted && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-surface/40">
                <button
                  type="button"
                  onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
                  disabled={activeStep === 1}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors cursor-pointer",
                    activeStep === 1
                      ? "opacity-0 pointer-events-none"
                      : "border border-border text-foreground hover:bg-surface-raised",
                  )}
                >
                  <ChevronLeft className="size-3.5" />
                  Back
                </button>

                {activeStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((s) => s + 1)}
                    disabled={!canProceed()}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold transition-all cursor-pointer",
                      canProceed()
                        ? "bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98]"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
                    )}
                  >
                    Continue
                    <ChevronRight className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        Submit Enquiry
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
