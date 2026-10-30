import { buildSheetsReport, historyRowFor, type ReportJob, type ReportProduct, type ReportLike, type SheetTable } from "./sheets-report-rules";
import type { FeedbackRow } from "./weekly-insights-rules";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
const SPREADSHEET_ID = "1yXkvJBhuvcl8whJOGAc57Fa86uNOvXzbj0JKIE2PbwQ";
const SHEETS_GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const PAGE_SIZE = 1000;

async function readPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const result = await fetchPage(start, start + PAGE_SIZE - 1);
    if (result.error) throw new Error(`Report data unavailable: ${result.error.message}`);
    rows.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < PAGE_SIZE) break;
  }
  return rows;
}

export async function readReportData(admin: Admin) {
  // Four paginated reads, never silently truncated by Supabase's default row cap.
  const [jobs, products, feedback, likes, members] = await Promise.all([
    readPages<ReportJob>((from, to) => admin.from("generation_jobs").select("id,user_id,kind,source,product_id,product_name,brand_name,status,category,created_at,deleted_at,studio_scene,result_image_url").eq("kind", "photo").eq("status", "completed").is("deleted_at", null).order("id").range(from, to)),
    readPages<ReportProduct>((from, to) => admin.from("try_on_products").select("id,catalog_product_id,name,category,style,brand,source").order("id").range(from, to)),
    readPages<FeedbackRow>((from, to) => admin.from("feedback_answers").select("job_id,question_id,answer").order("id").range(from, to)),
    readPages<ReportLike>((from, to) => admin.from("look_likes").select("job_id").order("job_id").order("user_id").range(from, to)),
    admin.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  if (members.error) throw new Error("Couldn't count members for the report.");
  return { jobs, products, feedback, likes, members: members.count ?? 0 };
}

async function sheetsRequest(path: string, init: RequestInit = {}) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !sheetsKey) throw new Error("Google Sheets reporting is not connected.");
  const response = await fetch(`${SHEETS_GATEWAY}/spreadsheets/${SPREADSHEET_ID}${path}`, {
    ...init,
    redirect: "manual",
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": sheetsKey, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Sheets report failed [${response.status}]: ${errorBody}`);
    throw new Error(`Google Sheets [${response.status}]: ${errorBody}`);
  }
  return response.json();
}

export async function sendSheetsReport(admin: Admin) {
  const data = await readReportData(admin);
  const report = buildSheetsReport(data.jobs, data.products, data.feedback, data.likes, data.members, new Date());
  const [history, saved] = await Promise.all([
    sheetsRequest("/values/'Weekly history'!A:J"),
    admin.from("insight_reports").select("payload,week_start").order("week_start", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (saved.error) throw new Error("Couldn't read saved AI insights.");
  const payload = saved.data?.payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload) && Array.isArray(payload.aiInsights)) {
    const table = report.tables.find((t) => t.title === "Insights");
    for (const text of payload.aiInsights) {
      if (typeof text === "string") table?.values.push(["AI narrative", text, "", "", `AI text saved for week ${saved.data?.week_start}; verify against observed numbers`]);
    }
  }
  const historyRows: unknown[][] = Array.isArray(history.values) ? history.values : [];
  const historyRow = historyRowFor(report.weekStart, historyRows);
  const sheetRequests: object[] = [];
  for (const [sheetId, table] of report.tables.entries()) {
    sheetRequests.push({ updateSheetProperties: { properties: { sheetId, gridProperties: { rowCount: Math.max(1000, table.title === "Weekly history" ? historyRow : table.values.length), columnCount: 26, frozenRowCount: 1 } }, fields: "gridProperties" } });
    if (table.title !== "Weekly history") sheetRequests.push({ updateCells: { range: { sheetId }, fields: "userEnteredValue" } });
  }
  // Clear stale snapshot cells and resize grids in one request; history is preserved.
  await sheetsRequest(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: sheetRequests }) });
  const updates = report.tables.filter((t) => t.title !== "Weekly history").map((t: SheetTable) => ({ range: `'${t.title}'!A1:T${t.values.length}`, values: t.values }));
  const historyTable = report.tables.find((t) => t.title === "Weekly history");
  if (historyTable) {
    updates.push({ range: "'Weekly history'!A1:J1", values: historyTable.values.slice(0, 1) });
    updates.push({ range: `'Weekly history'!A${historyRow}:J${historyRow}`, values: historyTable.values.slice(1) });
  }
  // RAW prevents customer answers from becoming formulas. One batch write, no per-cell calls.
  const written = await sheetsRequest("/values:batchUpdate", { method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data: updates }) });
  return { sent: true, spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`, weekStart: report.weekStart, summary: report.summary, updatedCells: written.totalUpdatedCells };
}