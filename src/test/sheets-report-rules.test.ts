import { describe, expect, it } from "vitest";
import { buildSheetsReport, historyRowFor, type ReportJob, type ReportProduct } from "@/components/web/sheets-report-rules";

const now = new Date("2026-10-30T23:00:00Z");
const product: ReportProduct = { id: "p1", catalog_product_id: "catalog-1", name: "Scarlet Dress", category: "Clothes", style: "Classic", brand: "Noir", source: "discover" };
const job = (id: string, overrides: Partial<ReportJob> = {}): ReportJob => ({ id, user_id: "private-member-id", kind: "photo", source: "discover", product_id: "p1", product_name: "Scarlet Dress", brand_name: "Noir", status: "completed", category: "Clothes", created_at: "2026-10-29T12:00:00Z", deleted_at: null, studio_scene: null, result_image_url: "https://private.invalid/photo", ...overrides });

describe("weekly Google Sheets reporting", () => {
  it("counts brand try-ons across product snapshots and distinct customers without baseline padding", () => {
    const report = buildSheetsReport([job("a"), job("b", { product_id: "p2", user_id: "second-user" }), job("c")], [product, { ...product, id: "p2" }], [], [{ job_id: "a" }], 7, now);
    const row = report.tables.find((t) => t.title === "Brand products")?.values[1];
    expect(row?.slice(5, 9)).toEqual([3, 2, 1, 0]);
    expect(report.summary.members).toBe(7);
    expect(report.summary.brandProducts).toBe(1);
  });

  it("excludes failed, deleted, video and Studio jobs from survey/try-on metrics", () => {
    const jobs = [job("a"), job("failed", { status: "failed" }), job("deleted", { deleted_at: now.toISOString() }), job("video", { kind: "video" }), job("studio", { studio_scene: "Model" })];
    const fb = jobs.map((j) => ({ job_id: j.id, question_id: "fit", answer: "Too fitted" }));
    const report = buildSheetsReport(jobs, [product], fb, [], 7, now);
    expect(report.summary.tryOns).toBe(1);
    expect(report.summary.images).toBe(2);
    expect(report.summary.surveyAnswers).toBe(1);
  });

  it("reports personal products separately and never invents a brand or exposes filename or customer identity", () => {
    const upload = { ...product, id: "upload", catalog_product_id: null, name: "jane@example.com-bag.jpg", brand: null, category: "unknown", source: "upload" };
    const report = buildSheetsReport([job("personal", { source: "own", product_id: "upload", product_name: upload.name, brand_name: null, category: "Bag" })], [upload], [{ job_id: "personal", question_id: "where", answer: "Internet" }], [], 7, now);
    const rows = report.tables.find((t) => t.title === "Personal products")?.values;
    expect(rows?.[1]?.slice(0, 3)).toEqual(["Uploaded bag 1", "Not supplied", "Bag"]);
    const text = JSON.stringify(report);
    expect(text).not.toContain("private-member-id");
    expect(text).not.toContain("jane@example.com");
    expect(text).not.toContain("https://private.invalid");
    expect(text).toContain("Internet: 1 (100%)");
  });

  it("counts weekly active customers separately from registered members", () => {
    const report = buildSheetsReport([job("old", { created_at: "2026-10-25T12:00:00Z", user_id: "old-user" }), job("a"), job("b")], [product], [], [], 15, now);
    expect(report.summary.members).toBe(15);
    expect(report.summary.activeCustomers).toBe(1);
  });

  it("uses observed answers and keeps visual fit concerns below 3 answers inconclusive", () => {
    const report = buildSheetsReport([job("a"), job("b")], [product], [{ job_id: "a", question_id: "fit", answer: "Too loose" }, { job_id: "a", question_id: "intent", answer: "Definitely" }], [], 7, now);
    const row = report.tables.find((t) => t.title === "Brand products")?.values[1];
    expect(row?.[9]).toBe(50);
    expect(row?.[11]).toBe("Insufficient feedback (<3)");
    expect(row?.[12]).toBe("Definitely: 1 (100%)");
  });

  it("updates this week's history row on repeated runs rather than duplicating it", () => {
    const rows = [["Week"], ["2026-10-19"], ["2026-10-26"]];
    expect(historyRowFor("2026-10-26", rows)).toBe(3);
    expect(historyRowFor("2026-11-02", rows)).toBe(4);
    expect(historyRowFor("2026-10-26", [])).toBe(2);
  });

  it("Monday's weekly digest counts the previous completed week and excludes new Monday activity", () => {
    const report = buildSheetsReport([job("last-week"), job("monday", { created_at: "2026-11-02T01:00:00Z", user_id: "new-week-user" })], [product], [], [], 7, new Date("2026-11-02T06:15:00Z"));
    expect(report.weekStart).toBe("2026-10-26");
    expect(report.summary.activeCustomers).toBe(1);
    expect(report.tables.find((t) => t.title === "Weekly history")?.values[1]?.[4]).toBe(1);
  });
});