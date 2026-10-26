import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ArrowRight } from "lucide-react";
import { useState } from "react";
import { categories } from "@/components/perla/data";
import { products } from "@/components/web/data";
import { PageHeader, Pill, ScoreBadge, Panel, Eyebrow } from "@/components/web/ui";
import after from "@/assets/model-after.jpg";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Discover — PERLA" },
      { name: "description", content: "Discover trending pieces and try them on virtually with PERLA." },
      { property: "og:title", content: "Discover — PERLA" },
      { property: "og:description", content: "Trending fashion pieces scored by AI." },
    ],
  }),
  component: Discover,
});

function Discover() {
  const [cat, setCat] = useState<string>("All");
  const list = cat === "All" ? products : products.filter((p) => p.category === cat);
  return (
    <div>
      <PageHeader eyebrow="Good morning, Nursultan" title="Start finding your" accent="signature style" />
      <Panel className="mb-10 grid items-center gap-6 overflow-hidden p-0 md:grid-cols-2">
        <div className="p-8 md:p-10">
          <Eyebrow>This week's edit</Eyebrow>
          <h2 className="mt-3 font-serif text-4xl">Parisian <em className="text-gold">Neutrals</em></h2>
          <p className="mt-3 text-muted-foreground">Silk, camel and ivory — curated from 2,340 try-ons by shoppers like you.</p>
          <Link to="/app/try-on" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground">Try the look <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <img src={after} alt="Parisian neutrals look" className="h-72 w-full object-cover md:h-full" />
      </Panel>
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", ...categories].map((c) => <Pill key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Pill>)}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <div key={p.id} className="group rounded-[1.75rem] bg-card p-3 shadow-card">
            <div className="relative overflow-hidden rounded-[1.4rem] bg-muted">
              <img src={p.image} alt={p.name} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" />
              <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90" aria-label="Save"><Heart className="h-4 w-4" /></button>
              <div className="absolute left-3 top-3"><ScoreBadge score={p.trend} /></div>
            </div>
            <div className="flex items-end justify-between p-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.brand}</p>
                <p className="font-serif text-xl">{p.name}</p>
              </div>
              <p className="font-serif text-xl">${p.price}</p>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">No pieces in this category yet.</p>}
      </div>
    </div>
  );
}
