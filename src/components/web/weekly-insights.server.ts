import { computeWeeklyNumbers, type WeeklyNumbers } from "./weekly-insights-rules";
import { readReportData } from "./sheets-report.server";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

// Reads every finished, non-studio try-on with its product and survey answers.
export async function loadWeeklyNumbers(admin: Admin): Promise<WeeklyNumbers> {
  const { jobs, products, feedback } = await readReportData(admin);
  const rows = jobs.filter((j) => !j.studio_scene && j.result_image_url);
  const categories = new Map(rows.filter((j) => j.product_id && j.category !== "unknown").map((j) => [j.product_id, j.category]));
  return computeWeeklyNumbers(rows, products.map((p) => ({ ...p, category: p.category === "unknown" ? categories.get(p.id) ?? p.category : p.category })), feedback);
}

export function insightsAuthorized(request: Request): boolean {
  // n8n's existing Supabase credential injects this header; no raw token in workflow parameters.
  const service = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  // Retire the old inline bearer: both n8n workflows now use stored credential auth only.
  return Boolean(service && sameSecret(request.headers.get("apikey") ?? "", service));
}

function sameSecret(given: string, secret: string): boolean {
  if (!secret || given.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
