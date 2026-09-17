"use client";
import { Filter, Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-105 border border-primary/30 shadow-[0_4px_14px_-4px_var(--color-primary)]",
  success: "bg-success text-success-foreground hover:brightness-105 border border-success/30",
  secondary:
    "bg-card text-foreground hover:bg-surface-raised border border-border shadow-[0_1px_4px_rgba(0,0,0,0.12)]",
  ghost: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent",
  danger: "bg-destructive/10 text-destructive hover:bg-destructive/18 border border-destructive/25",
};

export function ActionButton({
  children,
  onClick,
  variant = "secondary",
  icon,
  loading = false,
  disabled = false,
  size = "md",
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: (() => void) | undefined;
  variant?: Variant | undefined;
  icon?: ReactNode | undefined;
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
  size?: "sm" | "md" | undefined;
  className?: string | undefined;
  type?: "button" | "submit" | undefined;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variantClass[variant],
        className,
      )}
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

/* --------------------------------- SearchBar -------------------------------- */

export function SearchBar({
  value,
  onChange,
  placeholder = "Search customer, loan ID or phone",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("relative flex-1 min-w-[220px]", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        aria-label="Search cases"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
        style={{ fontFamily: "Poppins, sans-serif" }}
      />
    </div>
  );
}

/* --------------------------------- Select ---------------------------------- */

export function SelectField({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  className?: string | undefined;
}) {
  return (
    <label
      className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <span className="sr-only sm:not-sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-popover">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* --------------------------------- FilterBar -------------------------------- */

export function FilterBar({
  children,
  onReset,
  active,
}: {
  children: ReactNode;
  onReset?: (() => void) | undefined;
  active?: boolean | undefined;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.10)]">
      <Filter className="ml-0.5 size-3.5 text-muted-foreground" aria-hidden />
      {children}
      {active && onReset && (
        <ActionButton variant="ghost" size="sm" icon={<X className="size-3.5" />} onClick={onReset}>
          Clear
        </ActionButton>
      )}
    </div>
  );
}

/* -------------------------------- EmptyState -------------------------------- */

export function EmptyState({
  title,
  hint,
  icon,
  compact = false,
}: {
  title: string;
  hint?: string | undefined;
  icon?: ReactNode | undefined;
  compact?: boolean | undefined;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 text-center",
        compact ? "px-3 py-6" : "px-4 py-12",
      )}
    >
      <div className="text-muted-foreground/60">{icon}</div>
      <p
        className="text-sm font-medium text-muted-foreground"
        style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400 }}
      >
        {title}
      </p>
      {hint && (
        <p
          className="text-xs text-muted-foreground/70"
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300 }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

/* ---------------------------- ConfirmationModal ---------------------------- */

export function ConfirmationModal({
  open,
  title,
  description,
  details,
  confirmLabel,
  variant = "primary",
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string | undefined;
  details?: { label: string; value: ReactNode }[] | undefined;
  confirmLabel: string;
  variant?: Variant | undefined;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      return;
    }

    if (!prevOpenRef.current) {
      prevOpenRef.current = true;
      // Focus first input or modal container only on initial opening
      const input = ref.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        "input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
      );
      if (input) {
        input.focus();
      } else if (ref.current && !ref.current.contains(document.activeElement)) {
        ref.current.focus();
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      {/* Modal card — solid surface matching reference onboardingModalCard */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.45)] outline-none max-h-[90vh] overflow-y-auto"
      >
        {/* Modal header with border-bottom matching reference modalTopBar */}
        <div className="pb-4 mb-4 border-b border-border">
          <h2
            className="text-base font-medium text-foreground"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 400 }}
          >
            {title}
          </h2>
          {description && (
            <p
              className="mt-1 text-sm text-muted-foreground"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300 }}
            >
              {description}
            </p>
          )}
        </div>

        {details && details.length > 0 && (
          <dl className="mb-4 divide-y divide-border rounded-xl border border-border bg-surface/60">
            {details.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt
                  className="text-xs text-muted-foreground"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {d.label}
                </dt>
                <dd className="num text-sm font-semibold text-foreground">{d.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {children}
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton variant="ghost" onClick={onCancel}>
            Cancel
          </ActionButton>
          <ActionButton variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Fields --------------------------------- */

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  type?: string | undefined;
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-xs font-medium text-muted-foreground"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
        style={{ fontFamily: "Poppins, sans-serif" }}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  rows?: number | undefined;
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-xs font-medium text-muted-foreground"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
        style={{ fontFamily: "Poppins, sans-serif" }}
      />
    </label>
  );
}
