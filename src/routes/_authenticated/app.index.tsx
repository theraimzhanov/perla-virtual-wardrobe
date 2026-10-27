import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowUpRight, Shirt, ShoppingBag, Footprints, Circle } from "lucide-react";
import { useState } from "react";
import { discoverCategories, discoverProducts, type DiscoverCategory } from "@/components/web/data";
import { PageHeader, Eyebrow } from "@/components/web/ui";
import { Button } from "@/components/ui/button";
import { useTryOn } from "@/components/web/TryOnContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Discover — PERLA" },
      { name: "description", content: "Discover trending pieces and try them on virtually with PERLA." },
      { property: "og:title", content: "Discover — PERLA" },
      { property: "og:description", content: "Trending fashion pieces scored by AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

function Discover() {
  const [cat, setCat] = useState<DiscoverCategory>("Clothes");
  const { selectedIds, selectProduct, catalog, query } = useTryOn();
  const navigate = useNavigate();
  const term = query.trim().toLowerCase();
  const list = catalog.filter((product) =>
    product.category === cat &&
    (!term || [product.name, product.brand, product.style].some((field) => field.toLowerCase().includes(term)))
  );
  const icons = { Clothes: Shirt, Bag: ShoppingBag, Hat: Circle, Shoes: Footprints };
  const edit = ["g1", "g2", "g6"].map((id) => discoverProducts.find((product) => product.id === id)).filter((product) => product !== undefined);
  return (
    <div>
      <PageHeader eyebrow="Discover · The new collection" title="Find your next" accent="favorite" />
      <section aria-label="This week's edit" className="mb-9 grid items-center gap-6 border-y py-6 md:grid-cols-[1fr_1.35fr]">
        <div>
          <Eyebrow>This week's edit</Eyebrow>
          <h2 className="mt-3 font-serif text-4xl leading-tight">The art of <em className="text-gold">less.</em></h2>
          <p className="mt-3 text-sm text-muted-foreground">Soft silk. Sharp tailoring. A sculptural finish.</p>
          <p className="mt-4 text-[11px] uppercase text-gold">Parisian Neutrals · 03 pieces</p>
        </div>
        <div className="grid grid-cols-3 items-center gap-2 sm:gap-4">{edit.map((product, index) => <div key={product.id} className={cn("min-w-0", index === 1 && "pt-8")}><img src={product.image} alt={product.name} className="aspect-[3/4] w-full rounded-lg object-cover" /><p className="mt-2 text-center text-[10px] text-muted-foreground">{product.name}</p></div>)}</div>
      </section>
      <div className="mb-6 flex items-center justify-between gap-3"><div className="flex flex-wrap gap-2" role="group" aria-label="Product categories">{discoverCategories.map((category) => { const Icon = icons[category]; return <Button key={category} variant={cat === category ? "default" : "outline"} aria-pressed={cat === category} onClick={() => setCat(category)} className="rounded-full px-4"><Icon />{category}</Button>; })}</div><span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{list.length} new pieces</span></div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((product) => (
          <article key={product.id} aria-label={product.name} className="group overflow-hidden rounded-lg bg-card shadow-card">
            <div className="relative overflow-hidden bg-muted">
              <img src={product.image} alt={product.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-500 motion-safe:group-hover:scale-105" />
              <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[10px] uppercase">New form</span>
              <Button variant="secondary" size="icon" aria-label={`Try on ${product.name}`} title={`Try on ${product.name}`} onClick={() => { selectProduct(product.id); navigate({ to: "/app/try-on" }); }} className={cn("absolute right-3 top-3 h-14 w-14 rounded-full shadow-card [&_svg]:size-6", selectedIds.includes(product.id) ? "bg-primary text-gold hover:bg-primary" : "bg-background/95 text-gold")}><Sparkles /></Button>
            </div>
            <div className="p-5"><p className="text-[10px] uppercase text-muted-foreground">{product.brand}</p><h2 className="mt-1 font-serif text-2xl">{product.name}</h2><div className="mt-3 border-t pt-3"><p className="text-xs text-gold">{product.style}</p></div></div>
          </article>
        ))}
      </div>
      {list.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No pieces match “{query.trim()}” in {cat} yet.</p>}
      {selectedIds.length > 0 && <div className="mt-8 flex items-center justify-between gap-3 border-t pt-5"><p className="text-sm text-muted-foreground">{selectedIds.length} in your selection</p><Button asChild className="rounded-full"><Link to="/app/try-on">See it on you <ArrowUpRight /></Link></Button></div>}
    </div>
  );
}
