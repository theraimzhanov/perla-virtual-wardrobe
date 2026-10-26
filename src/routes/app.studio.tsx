import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, Sparkles } from "lucide-react";
import { studioStyles } from "@/components/perla/data";
import { studioGallery } from "@/components/web/data";
import { PageHeader, Panel, Pill, GoldButton } from "@/components/web/ui";
import after from "@/assets/model-after.jpg";
import dress from "@/assets/g-dress.jpg";
import trench from "@/assets/g-trench.jpg";
import blouse from "@/assets/g-blouse.jpg";

const imgs = [after, dress, trench, blouse];

export const Route = createFileRoute("/app/studio")({
  head: () => ({
    meta: [
      { title: "AI Studio — PERLA" },
      { name: "description", content: "Create editorial fashion photos of your outfits with AI." },
      { property: "og:title", content: "AI Studio — PERLA" },
      { property: "og:description", content: "Editorial AI fashion photography from a prompt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

function Studio() {
  const [style, setStyle] = useState("Editorial");
  const [prompt, setPrompt] = useState("Walking along the Seine at sunset, soft wind, film grain");
  return (
    <div>
      <PageHeader eyebrow="AI Studio" title="Your look," accent="editorialised" desc="Describe a scene and PERLA shoots it for you." />
      <Panel className="mb-10">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full resize-none rounded-2xl bg-secondary p-4 font-serif text-xl outline-none" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {studioStyles.map((s) => <Pill key={s} active={s === style} onClick={() => setStyle(s)}>{s}</Pill>)}
          <GoldButton className="ml-auto" onClick={() => toast.success(`${style} sample shoot queued`)}><Sparkles className="h-4 w-4" /> Generate look</GoldButton>
        </div>
      </Panel>
      <h2 className="mb-4 font-serif text-3xl">Recent creations</h2>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {studioGallery.map((g, i) => (
          <div key={g.title} className="overflow-hidden rounded-[1.75rem] bg-card shadow-card">
            <img src={imgs[i]} alt={g.title} className="aspect-[3/4] w-full object-cover" />
            <div className="flex items-center justify-between p-4">
              <div><p className="font-serif text-lg">{g.title}</p><p className="text-xs uppercase tracking-widest text-muted-foreground">{g.style}</p></div>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Heart className="h-4 w-4 text-gold" />{g.likes}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
