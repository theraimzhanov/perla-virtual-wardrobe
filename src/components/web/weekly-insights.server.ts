import { computeWeeklyNumbers, type WeeklyNumbers } from "./weekly-insights-rules";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

// Reads every finished, non-studio try-on with its product and survey answers.
export async function loadWeeklyNumbers(admin: Admin): Promise<WeeklyNumbers> {
  const { data: jobs, error } = await admin.from("generation_jobs")
    .select("id,user_id,kind,source,product_id,product_name,brand_name")
    .eq("status", "completed").is("deleted_at", null).is("studio_scene", null).limit(5000);
  if (error) throw new Error("Couldn't read try-ons.");
  const rows = jobs ?? [];
  const productIds = [...new Set(rows.map((j) => j.product_id).filter((id): id is string => Boolean(id)))];
  const [products, feedback] = await Promise.all([
    productIds.length ? admin.from("try_on_products").select("id,category,style,brand,source").in("id", productIds) : Promise.resolve({ data: [] }),
    admin.from("feedback_answers").select("job_id,question_id,answer").limit(20000),
  ]);
  return computeWeeklyNumbers(rows, products.data ?? [], feedback.data ?? []);
}

export function insightsAuthorized(request: Request): boolean {
  const secret = process.env["PERLA_INSIGHTS_SECRET"];
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || given.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
