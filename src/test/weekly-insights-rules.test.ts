import { describe, expect, it } from "vitest";
import { computeWeeklyNumbers, weekStartOf, weeklyAiSchema, type JobRow } from "@/components/web/weekly-insights-rules";

const u = "11111111-1111-4111-8111-111111111111";
const job = (id: string, over: Partial<JobRow> = {}): JobRow => ({ id, user_id: u, kind: "photo", source: "discover", product_id: "p1", product_name: "Silk Dress", brand_name: "Maison", ...over });

describe("weekly insights", () => {
  it("hides fit risk until a product has 3 fit answers", () => {
    const jobs = [job("a"), job("b")];
    const fb = jobs.map((j) => ({ job_id: j.id, question_id: "fit", answer: "Too fitted" }));
    expect(computeWeeklyNumbers(jobs, [], fb).fitRisk).toEqual([]);
  });

  it("fit risk is the share of too fitted plus too loose", () => {
    const jobs = [job("a"), job("b"), job("c"), job("d")];
    const answers = ["Too fitted", "Too loose", "Just right", "Just right"];
    const fb = jobs.map((j, i) => ({ job_id: j.id, question_id: "fit", answer: answers[i] ?? "Just right" }));
    expect(computeWeeklyNumbers(jobs, [], fb).fitRisk[0]?.risk).toBe(50);
  });

  it("shadow wardrobe counts only non-Discover photo try-ons", () => {
    const jobs = [job("a"), job("b", { source: "own", product_id: "p2" }), job("c", { source: "internet", product_id: "p2", kind: "video" })];
    const sw = computeWeeklyNumbers(jobs, [{ id: "p2", category: "Bag", style: null, brand: null, source: "upload" }], []).shadowWardrobe;
    expect(sw.total).toBe(1);
    expect(sw.categories).toEqual([{ label: "Bag", count: 1, share: 100 }]);
  });

  it("weeks start on Monday UTC", () => {
    expect(weekStartOf(new Date("2026-10-28T12:00:00Z"))).toBe("2026-10-26");
  });

  it("ignores survey answers not linked to eligible photo try-ons", () => {
    const result = computeWeeklyNumbers([job("a"), job("v", { kind: "video" })], [], [
      { job_id: "a", question_id: "intent", answer: "Definitely" },
      { job_id: "v", question_id: "intent", answer: "Pass for now" },
      { job_id: "missing", question_id: "intent", answer: "Pass for now" },
    ]);
    expect(result.trends.find((t) => t.question === "intent")?.options).toEqual([{ label: "Definitely", count: 1, share: 100 }]);
  });

  it("rejects style DNA for a non-uuid member", () => {
    expect(() => weeklyAiSchema.parse({ styleDna: [{ userId: "x", headline: "h" }] })).toThrow();
  });
});
