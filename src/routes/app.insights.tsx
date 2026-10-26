import { createFileRoute } from "@tanstack/react-router";
import { Heart, Sparkles, Wand2 } from "lucide-react";
import { discoverProducts, products } from "@/components/web/data";
import { PageHeader, Panel, Eyebrow } from "@/components/web/ui";
import { useTryOn } from "@/components/web/TryOnContext";
import { LookCard } from "@/components/web/LookCard";
import { rankDiscoverProducts, sharedVirtualLooks } from "@/components/web/brand-insights-rules";

export const Route = createFileRoute("/app/insights")({
  head: () => ({
    meta: [
      { title: "Brand Insights — PERLA" },
      { name: "description", content: "See which new pieces shoppers try on and love most, plus community looks and style trends." },
      { property: "og:title", content: "Brand Insights — PERLA" },
      { property: "og:description", content: "See what shoppers want before you produce it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Insights,
});

const likesFor = [1240, 860, 1510, 1980, 540, 1120];
const productSignals = [...products.map((p, i) => ({ id: p.id, tryOns: p.tryOns, likes: likesFor[i] ?? 500 })), { id: "g7", tryOns: 760, likes: 420 }];

const trends = [
  { label: "Soft neutral tones", share: 78, note: "Cream, sand and camel lead feedback" },
  { label: "Relaxed, flowing fits", share: 64, note: "“Too fitted” is the top fit complaint" },
  { label: "Evening minimal", share: 52, note: "Slip dresses get the most “Love it”" },
  { label: "Structured outerwear", share: 41, note: "Trench coats rising week over week" },
];

const aiInsights = [
  "Shoppers picture themselves most in flowing silhouettes — movement scores are 2× higher on dresses than on tailoring.",
  "Neutral palettes are the clear favourite; bold prints rarely reach a second try-on.",
  "Own uploads are mostly vintage outerwear — a signal to explore a heritage trench capsule.",
];

function Insights() {
  const { looks } = useTryOn();
  const ranked = rankDiscoverProducts(discoverProducts, productSignals, "tryOns").slice(0, 4);
  const community = sharedVirtualLooks(looks);
  return (
    <div>
      <PageHeader eyebrow="For brands · Maison Ivoire" title="What shoppers" accent="love" desc="Signals from try-ons, likes and feedback on new pieces." />
      <section aria-label="Discover product rankings">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Most tried on <em className="text-gold">& most liked</em></h2>
        </div>
        <ol tabIndex={0} aria-label="Most tried on and most liked products" className="grid snap-x snap-mandatory auto-cols-[min(15rem,80%)] grid-flow-col gap-4 overflow-x-auto pb-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring xl:auto-cols-[calc((100%_-_3rem)/4)]">
          {ranked.map((product) => <li key={product.id} aria-label={product.name} className="min-w-0 snap-start overflow-hidden rounded-lg bg-card shadow-card">
            <img src={product.image} alt={product.name} loading="lazy" className="aspect-[3/5] w-full object-cover" />
            <div className="px-3 pt-4 sm:px-4">
              <p className="break-words text-[10px] uppercase text-gold">{product.brand}</p>
              <h3 className="mt-1 break-words font-serif text-xl leading-tight">{product.name}</h3>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 pb-4 pt-3 text-xs tabular-nums sm:px-4">
              <span className="flex items-center gap-1.5" aria-label={`${product.tryOns} try-ons`}><Wand2 className="h-3.5 w-3.5 shrink-0 text-gold" />{product.tryOns.toLocaleString()} <span className="text-muted-foreground">try-ons</span></span>
              <span className="flex items-center gap-1.5" aria-label={`${product.likes} likes`}><Heart className="h-3.5 w-3.5 shrink-0 text-gold" />{product.likes.toLocaleString()} <span className="text-muted-foreground">likes</span></span>
            </div>
          </li>)}
        </ol>
      </section>

      <section aria-label="Community looks" className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><h2 className="font-serif text-3xl">Best looks <em className="text-gold">from the community</em></h2><span className="text-xs text-muted-foreground">{community.length} shared · most liked first</span></div>
        <div tabIndex={0} role="group" aria-label="Shared community photos and videos" className="grid snap-x snap-mandatory auto-cols-[min(15rem,80%)] grid-flow-col gap-4 overflow-x-auto pb-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring xl:auto-cols-[calc((100%_-_3rem)/4)]">{community.map((look) => <div key={look.id} className="min-w-0 snap-start"><LookCard look={look} /></div>)}</div>
      </section>

      <Panel className="mt-10">
        <h2 className="font-serif text-3xl">Trends <em className="text-gold">from feedback</em></h2>
        <p className="mt-1 text-sm text-muted-foreground">What kind of clothes people want next</p>
        <ul className="mt-5 grid gap-5 md:grid-cols-2">
          {trends.map((t) => (
            <li key={t.label}>
              <div className="flex justify-between text-sm"><span className="font-serif text-xl">{t.label}</span><span className="text-gold">{t.share}%</span></div>
              <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gold" style={{ width: `${t.share}%` }} /></div>
              <p className="mt-1.5 text-xs text-muted-foreground">{t.note}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-6 bg-primary text-primary-foreground">
        <Eyebrow><span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> AI insights</span></Eyebrow>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">{aiInsights.map((t) => <li key={t} className="rounded-2xl bg-primary-foreground/10 p-4 font-serif text-lg leading-snug">{t}</li>)}</ul>
      </Panel>
    </div>
  );
}
