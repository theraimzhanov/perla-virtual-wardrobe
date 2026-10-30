import { createFileRoute } from "@tanstack/react-router";
import { insightsAuthorized } from "@/components/web/weekly-insights.server";

// Fixed destination and no client-supplied data: n8n triggers a fresh database report.
export const Route = createFileRoute("/api/public/insights/sheets")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!insightsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength > 0) return Response.json({ error: "This report does not accept a request body." }, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendSheetsReport } = await import("@/components/web/sheets-report.server");
        try {
          return Response.json(await sendSheetsReport(supabaseAdmin), { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Report could not be sent." }, { status: 502 });
        }
      },
    },
  },
});