const DAY_MS = 86_400_000;
export const REPORT_INTERVAL_DAYS = 14;
export const FIRST_SCHEDULED_REPORT = "2026-11-13";

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function isReportDate(date: Date): boolean {
  const days = (utcDay(date) - Date.parse(FIRST_SCHEDULED_REPORT + "T00:00:00Z")) / DAY_MS;
  return days >= 0 && days % REPORT_INTERVAL_DAYS === 0;
}

export function nextReportDate(date = new Date()): string {
  const first = Date.parse(FIRST_SCHEDULED_REPORT + "T00:00:00Z");
  const elapsed = Math.max(0, utcDay(date) - first);
  const intervals = Math.ceil(elapsed / (REPORT_INTERVAL_DAYS * DAY_MS));
  return new Date(first + intervals * REPORT_INTERVAL_DAYS * DAY_MS).toISOString().slice(0, 10);
}

export function formatNextReport(date = new Date()): string {
  return new Date(nextReportDate(date) + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}