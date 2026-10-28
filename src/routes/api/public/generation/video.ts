import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/generation/video")({
  server: {
    handlers: {
      GET: () => Response.json({ processor: "perla-video-v1" }, { headers: { "cache-control": "no-store" } }),
      POST: async ({ request }) => {
        const { handleVideoWorkflow } = await import("@/components/web/generation-workflow.server");
        return handleVideoWorkflow(request);
      },
    },
  },
});
