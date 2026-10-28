import { createFileRoute } from "@tanstack/react-router";
import { weekStartOf, weeklyAiSchema } from "@/components/web/weekly-insights-rules";
import { insightsAuthorized, loadWeeklyNumbers } from "@/components/web/weekly-insights.server";

// Called once a week by n8n with a shared secret.
// GET: the week's numbers (n8n sends them to Gemini). POST: Gemini's text; the app saves the report and Style DNA.
export const Route = createFileRoute("/api/public/insights/weekly")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!insightsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        return Response.json(await loadWeeklyNumbers(supabaseAdmin));
      },
      POST: async ({ request }) => {
        if (!insightsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
        const parsed = weeklyAiSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { members, ...numbers } = await loadWeeklyNumbers(supabaseAdmin);
        const weekStart = weekStartOf(new Date());
        const payload = { ...numbers, weekStart, aiInsights: parsed.data.aiInsights, generatedAt: new Date().toISOString() };
        const saved = await supabaseAdmin.from("insight_reports").upsert({ week_start: weekStart, payload }, { onConflict: "week_start" });
        if (saved.error) return Response.json({ error: "Couldn't save report" }, { status: 500 });
        const known = new Set(members.map((m) => m.userId));
        const dna = parsed.data.styleDna.filter((d) => known.has(d.userId)).map((d) => ({ user_id: d.userId, headline: d.headline, tags: d.tags, updated_at: new Date().toISOString() }));
        if (dna.length) {
          const r = await supabaseAdmin.from("style_dna").upsert(dna, { onConflict: "user_id" });
          if (r.error) return Response.json({ error: "Couldn't save Style DNA" }, { status: 500 });
        }
        return Response.json({ saved: true, weekStart, styleDna: dna.length });
      },
    },
  },
});
