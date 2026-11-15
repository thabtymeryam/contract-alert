/**
 * Deadline tiers from the product spec:
 *   Critical < 7 days · Warning 7–30 days · Upcoming 30–90 days
 */
export type Severity = "critical" | "warning" | "upcoming";

export function severityFor(daysLeft: number): Severity | null {
  if (daysLeft < 0) return null;
  if (daysLeft < 7) return "critical";
  if (daysLeft <= 30) return "warning";
  if (daysLeft <= 90) return "upcoming";
  return null;
}

/** Soft background + strong text, readable at 4.5:1. Always pair with text, never color alone. */
export const severityStyles: Record<Severity, string> = {
  critical: "bg-critical-soft text-critical",
  warning: "bg-warning-soft text-warning",
  upcoming: "bg-upcoming-soft text-upcoming",
};
