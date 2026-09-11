export function inr(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

export function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function longDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "Z"));
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export function timeOf(stamp: string): string {
  return stamp.includes("T") ? stamp.split("T")[1]!.slice(0, 5) : "";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
