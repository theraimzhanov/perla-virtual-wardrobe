import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/web/ui";
import { TryOnExperience } from "@/components/web/TryOnExperience";

export const Route = createFileRoute("/_authenticated/app/try-on")({
  head: () => ({
    meta: [
      { title: "Virtual Try-On — PERLA" },
      { name: "description", content: "Upload a photo, build an outfit and see it on you instantly." },
      { property: "og:title", content: "Virtual Try-On — PERLA" },
      { property: "og:description", content: "Build an outfit and try it on virtually." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TryOn,
});

function TryOn() {
  return (
    <div>
      <PageHeader eyebrow="Virtual try-on" title="See it on" accent="you" />
      <TryOnExperience />
    </div>
  );
}
