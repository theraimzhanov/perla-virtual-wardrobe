import { computeWeeklyNumbers, type WeeklyNumbers } from "./weekly-insights-rules";
import { readReportData } from "./sheets-report.server";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

// Reads every finished, non-studio try-on with its product and survey answers.
export async function loadWeeklyNumbers(admin: Admin): Promise<WeeklyNumbers> {
  const { jobs, products, feedback } = await readReportData(admin);
  const rows = jobs.filter((j) => !j.studio_scene && j.result_image_url);
  return computeWeeklyNumbers(rows, products, feedback);
}

export function insightsAuthorized(request: Request): boolean {
  // n8n's existing Supabase credential injects this header; no raw token in workflow parameters.
  const service = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (service && sameSecret(request.headers.get("apikey") ?? "", service)) return true;
  const secret = process.env["PERLA_INSIGHTS_SECRET"];
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return Boolean(secret && sameSecret(given, secret));
}

function sameSecret(given: string, secret: string): boolean {
  if (!secret || given.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
