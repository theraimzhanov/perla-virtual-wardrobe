import { createFileRoute } from "@tanstack/react-router";
import { PerlaApp } from "@/components/perla/PerlaApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PERLA — Virtual Try-On & AI Fashion Studio" },
      { name: "description", content: "Upload your photo, build outfits and try them on virtually with PERLA." },
      { property: "og:title", content: "PERLA — Elegance, Reimagined" },
      { property: "og:description", content: "Virtual try-on, outfit builder and AI fashion photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerlaApp,
});
