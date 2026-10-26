import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Upload, Wand2, X } from "lucide-react";
import { CompareSlider } from "@/components/perla/CompareSlider";
import { modelBefore, modelAfter } from "@/components/perla/data";
import { products } from "@/components/web/data";
import { PageHeader, Panel, GoldButton, Eyebrow } from "@/components/web/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/try-on")({
  head: () => ({
    meta: [
      { title: "Virtual Try-On — PERLA" },
      { name: "description", content: "Upload a photo, build an outfit and see it on you instantly." },
      { property: "og:title", content: "Virtual Try-On — PERLA" },
      { property: "og:description", content: "Build an outfit and try it on virtually." },
    ],
  }),
  component: TryOn,
});

function TryOn() {
  const [photo, setPhoto] = useState<string | null>(modelBefore);
  const [outfit, setOutfit] = useState<string[]>(["g1", "g2"]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(160);
  const toggle = (id: string) => setOutfit((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const generate = () => {
    if (!photo || outfit.length === 0) {
      toast.error("Add a photo and at least one piece");
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); toast.success("Look ready · 1 credit used"); }, 1400);
  };
  return (
    <div>
      <PageHeader eyebrow="Virtual try-on" title="See it on" accent="you" desc="Upload a full-body photo, choose your pieces, and let PERLA dress you." />
      <div className="grid gap-8 xl:grid-cols-[1fr_1.1fr]">
        <Panel>
          {done && photo ? (
            <CompareSlider before={photo} after={modelAfter} />
          ) : photo ? (
            <div className="relative"><img src={photo} alt="Your photo" className="aspect-[3/4] w-full rounded-2xl object-cover" />
              <button onClick={() => setPhoto(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90" aria-label="Remove photo"><X className="h-4 w-4" /></button></div>
          ) : (
            <label className="grid aspect-[3/4] cursor-pointer place-items-center rounded-2xl border-2 border-dashed bg-muted/50 text-center">
              <div><Upload className="mx-auto h-8 w-8 text-gold" /><p className="mt-3 font-serif text-2xl">Upload your photo</p><p className="text-sm text-muted-foreground">JPG or PNG, full body works best</p></div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhoto(URL.createObjectURL(f)); setDone(false); } }} />
            </label>
          )}
          {done && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Fit score</p><p className="font-serif text-3xl">94<span className="text-base text-muted-foreground">/100</span></p></div>
              <div className="rounded-2xl bg-secondary p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Trend score</p><p className="font-serif text-3xl">88<span className="text-base text-muted-foreground">/100</span></p></div>
            </div>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl">Wardrobe</h2><span className="text-sm text-muted-foreground">{outfit.length} selected</span></div>
            <div className="grid grid-cols-3 gap-3">
              {products.map((p) => {
                const on = outfit.includes(p.id);
                return (
                  <button key={p.id} onClick={() => toggle(p.id)} className={cn("relative overflow-hidden rounded-2xl text-left ring-2 transition", on ? "ring-gold" : "ring-transparent")}>
                    <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" />
                    {on && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-gold text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>}
                    <p className="truncate px-1 py-1.5 text-xs">{p.name}</p>
                  </button>
                );
              })}
            </div>
          </Panel>
          <Panel>
            <Eyebrow>Would you buy it?</Eyebrow>
            <p className="mt-2 font-serif text-2xl">I'd buy this outfit at <span className="text-gold">${price}</span></p>
            <input type="range" min={60} max={400} step={10} value={price} onChange={(e) => setPrice(+e.target.value)} className="mt-4 w-full accent-[var(--gold)]" />
            <button onClick={() => toast.success("Thanks! Brands will see your feedback.")} className="mt-3 text-sm underline underline-offset-4">Send feedback to brands</button>
          </Panel>
          <GoldButton onClick={generate} className="w-full py-4 text-base"><Wand2 className="h-4 w-4" /> {loading ? "Dressing you…" : "Generate try-on · 1 credit"}</GoldButton>
        </div>
      </div>
    </div>
  );
}
