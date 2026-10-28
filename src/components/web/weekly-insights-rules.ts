import { z } from "zod";

// Pure rules for the weekly Brand Insights report. The app computes every number;
// the weekly n8n job only adds written AI insights and Style DNA text.

export const MIN_FIT_ANSWERS = 3;

export type FeedbackRow = { job_id: string; question_id: string; answer: string };
export type JobRow = { id: string; user_id: string; kind: string; source: string; product_id: string | null; product_name: string | null; brand_name: string | null };
export type ProductRow = { id: string; category: string; style: string | null; brand: string | null; source: string };

export type Breakdown = { label: string; count: number; share: number };
export type Trend = { question: string; title: string; total: number; options: Breakdown[] };
export type FitRisk = { product: string; brand: string | null; answers: number; tooFitted: number; tooLoose: number; risk: number };
export type ShadowWardrobe = { total: number; categories: Breakdown[]; sources: Breakdown[] };
export type MemberStyle = { userId: string; tryOns: number; categories: string[]; styles: string[]; brands: string[]; occasions: string[] };
export type WeeklyNumbers = { trends: Trend[]; fitRisk: FitRisk[]; shadowWardrobe: ShadowWardrobe; members: MemberStyle[] };
export type WeeklyReport = Omit<WeeklyNumbers, "members"> & { weekStart: string; aiInsights: string[]; generatedAt: string };

const TREND_QUESTIONS: Array<{ id: string; title: string }> = [
  { id: "fit", title: "Silhouette" },
  { id: "occasion", title: "Occasion" },
  { id: "color", title: "Colorway" },
  { id: "price", title: "Quality feel" },
  { id: "intent", title: "Wardrobe intent" },
];

export function breakdown(values: string[]): Breakdown[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const total = values.length;
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, share: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const top = (values: Array<string | null | undefined>, n = 3) =>
  breakdown(values.filter((v): v is string => Boolean(v) && v !== "unknown")).slice(0, n).map((b) => b.label);

export function computeWeeklyNumbers(jobs: JobRow[], products: ProductRow[], feedback: FeedbackRow[]): WeeklyNumbers {
  const productOf = new Map(products.map((p) => [p.id, p]));
  const jobOf = new Map(jobs.map((j) => [j.id, j]));
  const answersOf = (q: string) => feedback.filter((f) => f.question_id === q);

  const trends = TREND_QUESTIONS.map(({ id, title }) => {
    const answers = answersOf(id).map((f) => f.answer);
    return { question: id, title, total: answers.length, options: breakdown(answers) };
  }).filter((t) => t.total > 0);

  // Fit & sizing risk per Discover product: share of "Too fitted" + "Too loose".
  const fitByProduct = new Map<string, FitRisk>();
  for (const f of answersOf("fit")) {
    const job = jobOf.get(f.job_id);
    if (!job || job.source !== "discover" || !job.product_name) continue;
    const key = `${job.product_name}|${job.brand_name ?? ""}`;
    const row = fitByProduct.get(key) ?? { product: job.product_name, brand: job.brand_name, answers: 0, tooFitted: 0, tooLoose: 0, risk: 0 };
    row.answers++;
    if (f.answer === "Too fitted") row.tooFitted++;
    if (f.answer === "Too loose") row.tooLoose++;
    fitByProduct.set(key, row);
  }
  const fitRisk = [...fitByProduct.values()]
    .filter((r) => r.answers >= MIN_FIT_ANSWERS)
    .map((r) => ({ ...r, risk: Math.round(((r.tooFitted + r.tooLoose) / r.answers) * 100) }))
    .sort((a, b) => b.risk - a.risk || b.answers - a.answers)
    .slice(0, 6);

  // Shadow Wardrobe: pieces members try on that are not from Discover.
  const outside = jobs.filter((j) => j.kind === "photo" && j.source !== "discover");
  const shadowWardrobe: ShadowWardrobe = {
    total: outside.length,
    categories: breakdown(outside.map((j) => (j.product_id ? productOf.get(j.product_id)?.category : null) ?? "unknown").map((c) => (c === "unknown" ? "Unsorted" : c))),
    sources: breakdown(outside.map((j) => ({ own: "Own closet", internet: "Internet", store: "Store" } as Record<string, string>)[j.source] ?? "Other")),
  };

  const members = [...new Set(jobs.map((j) => j.user_id))].map((userId) => {
    const mine = jobs.filter((j) => j.user_id === userId && j.kind === "photo");
    const items = mine.map((j) => (j.product_id ? productOf.get(j.product_id) : undefined));
    const myJobIds = new Set(mine.map((j) => j.id));
    return {
      userId,
      tryOns: mine.length,
      categories: top(items.map((p) => p?.category)),
      styles: top(items.map((p) => p?.style)),
      brands: top(mine.map((j) => j.brand_name)),
      occasions: top(feedback.filter((f) => f.question_id === "occasion" && myJobIds.has(f.job_id)).map((f) => f.answer), 2),
    };
  }).filter((m) => m.tryOns > 0);

  return { trends, fitRisk, shadowWardrobe, members };
}

/** Monday (UTC) of the week containing `date`, as YYYY-MM-DD. */
export function weekStartOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export const weeklyAiSchema = z.object({
  aiInsights: z.array(z.string().trim().min(1).max(400)).max(6).default([]),
  styleDna: z.array(z.object({
    userId: z.string().uuid(),
    headline: z.string().trim().min(1).max(120),
    tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  })).max(5000).default([]),
});
