import { describe, expect, it } from "vitest";
import { isReportDate, nextReportDate, REPORT_INTERVAL_DAYS } from "@/components/web/report-schedule";

describe("fortnightly reporting", () => {
  it("schedules the next update two weeks after the October 30 report", () => {
    expect(nextReportDate(new Date("2026-10-30T23:21:00Z"))).toBe("2026-11-13");
  });

  it("does not send a scheduled report before November 13", () => {
    expect(isReportDate(new Date("2026-11-06T06:00:00Z"))).toBe(false);
    expect(isReportDate(new Date("2026-10-30T06:00:00Z"))).toBe(false);
  });

  it("sends Gemini and Sheets reports every 14 days on the anchored dates", () => {
    expect(REPORT_INTERVAL_DAYS).toBe(14);
    expect(isReportDate(new Date("2026-11-13T06:00:00Z"))).toBe(true);
    expect(isReportDate(new Date("2026-11-20T06:00:00Z"))).toBe(false);
    expect(isReportDate(new Date("2026-11-27T06:15:00Z"))).toBe(true);
    expect(isReportDate(new Date("2026-12-11T06:00:00Z"))).toBe(true);
  });

  it("keeps upcoming dates aligned after month and year boundaries", () => {
    expect(nextReportDate(new Date("2026-11-14T00:00:00Z"))).toBe("2026-11-27");
    expect(nextReportDate(new Date("2026-12-26T00:00:00Z"))).toBe("2027-01-08");
  });
});