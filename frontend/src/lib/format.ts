/**
 * Locale-aware formatters. The backend sends dates as "YYYY-MM-DD" strings;
 * they're parsed as local calendar dates so they never shift by a day.
 */

const intlLocale = (locale: string) => (locale === "fr" ? "fr-FR" : "en-GB");

export function parseDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** dd/MM/yyyy in both supported locales. */
export function formatDate(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDate(value));
}

export function formatCurrency(
  amount: number | null | undefined,
  locale: string,
  currency = "TND",
): string | null {
  if (amount === null || amount === undefined) return null;
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Unknown currency code from AI extraction — fall back to "45 000 XYZ"
    return `${new Intl.NumberFormat(intlLocale(locale)).format(amount)} ${currency}`;
  }
}

/** Whole calendar days from today to the date (negative = past). */
export function daysUntil(value: string, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((parseDate(value).getTime() - start.getTime()) / 86_400_000);
}

/** "5 minutes ago", "yesterday", "3 days ago" for a timestamp (ISO string). */
export function formatTimeAgo(value: string, locale: string, now = Date.now()): string {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 30 * 86_400) return rtf.format(Math.round(seconds / 86_400), "day");
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

/** "in 5 days", "tomorrow", "3 days ago" / "dans 5 jours", "demain"… */
export function formatRelativeDays(days: number, locale: string): string {
  return new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" }).format(days, "day");
}
