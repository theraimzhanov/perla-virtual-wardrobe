import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/generation/photo")({
  server: {
    handlers: {
      GET: () => Response.json({ processor: "perla-photo-v1" }, { headers: { "cache-control": "no-store" } }),
      POST: async ({ request }) => {
        const { handlePhotoWorkflow } = await import("@/components/web/generation-workflow.server");
        return handlePhotoWorkflow(request);
      },
    },
  },
});