import { breakdown, computeWeeklyNumbers, weekStartOf, type FeedbackRow, type JobRow, type ProductRow } from "./weekly-insights-rules";

export type ReportJob = JobRow & { status: string; category: string; created_at: string; deleted_at: string | null; studio_scene: string | null; result_image_url: string | null };
export type ReportProduct = ProductRow & { catalog_product_id: string | null; name: string };
export type ReportLike = { job_id: string };
export type SheetCell = string | number;
export type SheetTable = { title: string; values: SheetCell[][] };
export const REPORT_SHEETS = ["Overview", "Brand products", "Personal products", "Survey feedback", "Brand summary", "Insights", "Weekly history"] as const;
const questionNames: Record<string, string> = { fit: "Silhouette feedback", occasion: "Occasion", color: "Color preference", price: "Perceived quality/value", intent: "Wardrobe intent", category: "Customer-reported category", where: "Customer-reported source", similar: "Interest in similar products" };
const summary = (answers: string[]) => breakdown(answers).map((r) => `${r.label}: ${r.count} (${r.share}%)`).join("; ");
const percentage = (part: number, total: number): SheetCell => total ? Math.round(part / total * 100) : "No answers";

/** No member identifiers, emails, private image links or uploaded filenames leave this module. */
export function buildSheetsReport(jobs: ReportJob[], products: ReportProduct[], feedback: FeedbackRow[], likes: ReportLike[], members: number, now: Date) {
  const images = jobs.filter((j) => j.kind === "photo" && j.status === "completed" && !j.deleted_at && j.result_image_url);
  const tryOns = images.filter((j) => !j.studio_scene);
  const jobIds = new Set(tryOns.map((j) => j.id));
  const fb = feedback.filter((f) => jobIds.has(f.job_id));
  const pieces = new Map(products.map((p) => [p.id, p]));
  const keyOf = (j: ReportJob) => {
    const p = j.product_id ? pieces.get(j.product_id) : undefined;
    return j.source === "discover" ? `catalog:${p?.catalog_product_id ?? j.product_id ?? `${j.product_name}|${j.brand_name}`}` : `upload:${j.product_id ?? j.id}`;
  };
  const groups = new Map<string, ReportJob[]>();
  for (const j of tryOns) {
    const key = keyOf(j);
    groups.set(key, [...(groups.get(key) ?? []), j]);
  }
  const currentMonday = weekStartOf(now);
  // Monday's scheduled digest describes the week that just finished, not six hours of Monday activity.
  const periodStart = new Date(`${currentMonday}T00:00:00.000Z`);
  if (now.getUTCDay() === 1) periodStart.setUTCDate(periodStart.getUTCDate() - 7);
  const weekStart = periodStart.toISOString().slice(0, 10);
  const nextMonday = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const periodEnd = new Date(Math.min(now.getTime(), nextMonday.getTime()));
  const thisWeek = tryOns.filter((j) => j.created_at >= periodStart.toISOString() && j.created_at < periodEnd.toISOString());
  const imageIds = new Set(images.map((j) => j.id));
  const totalLikes = likes.filter((l) => imageIds.has(l.job_id)).length;
  const eligibleLikes = likes.filter((l) => jobIds.has(l.job_id));
  const weeklyIds = new Set(thisWeek.map((j) => j.id));
  const weeklyFeedback = fb.filter((f) => weeklyIds.has(f.job_id));
  const active = new Set(thisWeek.map((j) => j.user_id)).size;
  const productHeaders: SheetCell[] = ["Product", "Brand", "Category", "Style", "Source", "Completed try-ons", "Unique customers", "Likes", "Surveyed try-ons", "Survey response %", "Fit answers", "Visual fit concern %", "Wardrobe intent", "Occasions", "Color preferences", "Quality/value", "Interest in similar pieces", "Customer-reported source", "Try-ons this week", "Evidence"];
  const brandProducts: SheetCell[][] = [productHeaders];
  const personalProducts: SheetCell[][] = [productHeaders];
  const survey: SheetCell[][] = [["Product", "Brand", "Category", "Source", "Question", "Customer feedback", "Answers", "Share of answers %"]];
  const brandGroups = new Map<string, ReportJob[]>();
  let uploadNumber = 0;
  for (const mine of groups.values()) {
    const j = mine[0];
    if (!j) continue;
    const p = j.product_id ? pieces.get(j.product_id) : undefined;
    const ids = new Set(mine.map((r) => r.id));
    const answers = fb.filter((f) => ids.has(f.job_id));
    const forQ = (q: string) => answers.filter((f) => f.question_id === q).map((f) => f.answer);
    const category = j.category !== "unknown" ? j.category : p?.category !== "unknown" && p?.category ? p.category : forQ("category")[0] ?? "Unclassified";
    const catalog = j.source === "discover";
    const name = catalog ? j.product_name ?? p?.name ?? "Catalog product" : `Uploaded ${category.toLowerCase()} ${++uploadNumber}`;
    const brand = catalog ? j.brand_name ?? p?.brand ?? "Not supplied" : p?.brand || "Not supplied";
    const source = catalog ? "Discover catalog" : "Personal upload";
    const fit = forQ("fit");
    const concerns = fit.filter((a) => a === "Too fitted" || a === "Too loose").length;
    const surveyed = new Set(answers.map((a) => a.job_id)).size;
    const row: SheetCell[] = [name, brand, category, p?.style ?? "Not supplied", source, mine.length, new Set(mine.map((r) => r.user_id)).size, eligibleLikes.filter((l) => ids.has(l.job_id)).length, surveyed, percentage(surveyed, mine.length), fit.length, fit.length >= 3 ? percentage(concerns, fit.length) : "Insufficient feedback (<3)", summary(forQ("intent")), summary(forQ("occasion")), summary(forQ("color")), summary(forQ("price")), summary(forQ("similar")), summary(forQ("where")), mine.filter((r) => weeklyIds.has(r.id)).length, surveyed < 5 ? "Small sample; directional only" : "Observed feedback, not a sales forecast"];
    (catalog ? brandProducts : personalProducts).push(row);
    if (catalog) brandGroups.set(brand, [...(brandGroups.get(brand) ?? []), ...mine]);
    for (const q of [...new Set(answers.map((a) => a.question_id))]) {
      for (const option of breakdown(forQ(q))) survey.push([name, brand, category, source, questionNames[q] ?? q, option.label, option.count, option.share]);
    }
  }
  const brands: SheetCell[][] = [["Brand", "Categories", "Distinct products tried", "Completed try-ons", "Unique customers", "Likes", "Surveyed try-ons", "Wardrobe-intent answers", "Definitely add %", "Try-ons this week", "Evidence"]];
  for (const [brand, mine] of brandGroups) {
    const ids = new Set(mine.map((j) => j.id));
    const answers = fb.filter((f) => ids.has(f.job_id));
    const intent = answers.filter((a) => a.question_id === "intent");
    brands.push([brand, [...new Set(mine.map((j) => j.category))].join(", "), new Set(mine.map(keyOf)).size, mine.length, new Set(mine.map((j) => j.user_id)).size, eligibleLikes.filter((l) => ids.has(l.job_id)).length, new Set(answers.map((a) => a.job_id)).size, intent.length, percentage(intent.filter((a) => a.answer === "Definitely").length, intent.length), mine.filter((j) => weeklyIds.has(j.id)).length, "Intent is self-reported; no sales/returns measured"]);
  }
  const numbers = computeWeeklyNumbers(tryOns, products, fb);
  const insights: SheetCell[][] = [["Section", "Signal", "Count", "Share %", "Meaning / limitation"]];
  for (const t of numbers.trends) for (const o of t.options) insights.push(["Feedback trends", `${t.title}: ${o.label}`, o.count, o.share, `${t.total} answers; self-reported preference`]);
  for (const r of numbers.fitRisk) insights.push(["Visual fit concerns", `${r.brand ?? ""} ${r.product}`.trim(), r.answers, r.risk, "Too fitted + too loose; visual feedback, not measured sizing or return risk"]);
  for (const c of numbers.shadowWardrobe.categories) insights.push(["Shadow Wardrobe", c.label, c.count, c.share, "Completed try-ons of personally uploaded products; not a verified owned wardrobe"]);
  const similar = fb.filter((a) => a.question_id === "similar");
  for (const o of breakdown(similar.map((a) => a.answer))) insights.push(["Discovery opportunity", `Want similar products: ${o.label}`, o.count, o.share, "Interest among personal-upload respondents"]);
  const overview: SheetCell[][] = [["Metric", "Value", "Definition"], ["Updated (UTC)", now.toISOString(), "Latest real-data snapshot"], ["Reporting week starts (UTC)", weekStart, "Monday runs report the previous full week; other days show the current partial week"], ["Reporting period ends (UTC)", periodEnd.toISOString(), "Exclusive period end"], ["Registered members", members, "Saved member profiles; not weekly active users"], ["Active try-on customers this week", active, "Distinct customers with a completed try-on created in the reporting week"], ["Completed virtual try-ons", tryOns.length, "Non-deleted, non-Studio photo jobs with a saved result"], ["Distinct products tried", groups.size, "Catalog products deduplicated across customers; personal uploads counted separately"], ["All images created", images.length, "Saved Try-On + AI Studio photos, excluding deleted results"], ["Real likes", totalLikes, "Saved likes on completed, non-deleted photos"], ["Survey answers", fb.length, "Answers linked only to eligible completed Try-On jobs"], ["Surveyed try-ons", new Set(fb.map((f) => f.job_id)).size, "One survey per try-on; not a unique-person count"], ["Personal-product try-ons", numbers.shadowWardrobe.total, "Source outside Discover"], ["Try-ons this week", thisWeek.length, "Completed try-ons created during the reporting week"], ["Privacy", "Aggregated feedback only", "No names, emails, member identifiers, photos or uploaded filenames exported"], ["Reporting scope", "Latest tabs are cumulative", "Weekly history stores a snapshot keyed by UTC week; reruns update that week's row"], ["Business interpretation", "Demand signals, not proven sales", "No invented brand types, prices, conversions or returns; small samples are directional"]];
  const history: SheetCell[][] = [["Week starts (UTC)", "Last updated (UTC)", "Registered members", "Active try-on customers", "Try-ons this week", "Products tried this week", "Survey answers on this week's try-ons", "Cumulative try-ons", "Cumulative images", "Cumulative likes"], [weekStart, now.toISOString(), members, active, thisWeek.length, new Set(thisWeek.map(keyOf)).size, weeklyFeedback.length, tryOns.length, images.length, totalLikes]];
  const tables: SheetTable[] = [{ title: "Overview", values: overview }, { title: "Brand products", values: brandProducts }, { title: "Personal products", values: personalProducts }, { title: "Survey feedback", values: survey }, { title: "Brand summary", values: brands }, { title: "Insights", values: insights }, { title: "Weekly history", values: history }];
  return { tables, weekStart, summary: { members, activeCustomers: active, tryOns: tryOns.length, images: images.length, likes: totalLikes, surveyAnswers: fb.length, brandProducts: brandProducts.length - 1, personalProducts: personalProducts.length - 1 } };
}

/** Replace this week's snapshot instead of appending a duplicate on manual reruns. */
export function historyRowFor(weekStart: string, rows: unknown[][]): number {
  const index = rows.findIndex((r, i) => i > 0 && r[0] === weekStart);
  return index >= 1 ? index + 1 : Math.max(2, rows.length + 1);
}