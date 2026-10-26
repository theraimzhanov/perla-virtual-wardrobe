import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { categories } from "@/components/perla/data";
import { products } from "@/components/web/data";
import { PageHeader, Panel, GoldButton } from "@/components/web/ui";

export const Route = createFileRoute("/app/wardrobe")({
  head: () => ({
    meta: [
      { title: "My Wardrobe — PERLA" },
      { name: "description", content: "All your saved and uploaded pieces, organised by category." },
      { property: "og:title", content: "My Wardrobe — PERLA" },
      { property: "og:description", content: "Your digital wardrobe in one place." },
    ],
  }),
  component: Wardrobe,
});

function Wardrobe() {
  return (
    <div>
      <PageHeader eyebrow="Digital wardrobe" title="Everything you" accent="own & love" action={<GoldButton><Plus className="h-4 w-4" /> Add clothing</GoldButton>} />
      <div className="space-y-8">
        {categories.map((c) => {
          const items = products.filter((p) => p.category === c);
          return (
            <Panel key={c}>
              <div className="mb-4 flex items-baseline justify-between"><h2 className="font-serif text-2xl">{c}</h2><span className="text-sm text-muted-foreground">{items.length} pieces</span></div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {items.map((p) => (
                  <div key={p.id} className="w-40 shrink-0">
                    <img src={p.image} alt={p.name} className="aspect-square w-full rounded-2xl object-cover" />
                    <p className="mt-2 text-sm">{p.name}</p><p className="text-xs text-muted-foreground">{p.brand}</p>
                  </div>
                ))}
                <button className="grid aspect-square w-40 shrink-0 place-items-center rounded-2xl border-2 border-dashed text-muted-foreground" aria-label={`Add ${c}`}><Plus className="h-6 w-6" /></button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
