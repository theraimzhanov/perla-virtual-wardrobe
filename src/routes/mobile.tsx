import { createFileRoute } from "@tanstack/react-router";
import { PerlaApp } from "@/components/perla/PerlaApp";

export const Route = createFileRoute("/mobile")({
  head: () => ({
    meta: [
      { title: "PERLA Mobile — Virtual Try-On" },
      { name: "description", content: "The PERLA mobile experience: try-on, AI Studio and profile." },
      { property: "og:title", content: "PERLA Mobile" },
      { property: "og:description", content: "Virtual try-on in your pocket." },
    ],
  }),
  component: PerlaApp,
});
