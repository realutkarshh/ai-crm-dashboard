import { format, formatDistanceToNow, isValid } from "date-fns";

/**
 * Indian rupee formatter — e.g. 150000 → "₹1,50,000".
 * When compact=true uses Indian abbreviations: K / L / Cr
 * instead of Western M / B so charts show ₹2.5L, ₹1.2Cr, etc.
 */
export function currency(value = 0, { compact = false } = {}) {
  const n = Number(value) || 0;
  if (compact) return formatCompact(n);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Smart Indian abbreviation:
 *   < 1 000        → ₹500
 *   1 000–99 999   → ₹2.5K
 *   1 00 000–      → ₹2.5L
 *   1 00 00 000+   → ₹1.2Cr
 */
export function formatCompact(value = 0) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_00_00_000) {
    const v = abs / 1_00_00_000;
    return `${sign}₹${+v.toFixed(2)}Cr`;
  }
  if (abs >= 1_00_000) {
    const v = abs / 1_00_000;
    return `${sign}₹${+v.toFixed(2)}L`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return `${sign}₹${+v.toFixed(1)}K`;
  }
  return `${sign}₹${abs}`;
}

/**
 * Plain Indian number format (no currency symbol):
 *   1234567 → "12,34,567"
 */
export function formatNumber(value = 0) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("en-IN").format(n);
}

/** Short, human date: "16 Jun 2025". */
export function shortDate(value) {
  const d = new Date(value);
  return isValid(d) ? format(d, "dd MMM yyyy") : "—";
}

/** "10:30 PM" time string. */
export function timeOf(value) {
  const d = new Date(value);
  return isValid(d) ? format(d, "hh:mm a") : "";
}

/** Relative time: "3 days ago". */
export function relative(value) {
  const d = new Date(value);
  return isValid(d) ? `${formatDistanceToNow(d)} ago` : "";
}

/** YYYY-MM-DD value for <input type="date"> binding. */
export function dateInputValue(value) {
  const d = new Date(value);
  return isValid(d) ? format(d, "yyyy-MM-dd") : "";
}
