import { createFileRoute } from "@tanstack/react-router";
import { Heart, Sparkles, Wand2 } from "lucide-react";
import { products } from "@/components/web/data";
import { PageHeader, Panel, Eyebrow } from "@/components/web/ui";
import { useTryOn } from "@/components/web/TryOnContext";
import { LookCard } from "@/components/web/LookCard";
import { byLikes } from "@/components/web/looks";

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
const ranked = products.map((p, i) => ({ ...p, likes: likesFor[i] ?? 500 }));
const mostTried = [...ranked].sort((a, b) => b.tryOns - a.tryOns).slice(0, 3);
const mostLiked = [...ranked].sort((a, b) => b.likes - a.likes).slice(0, 3);

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

function ProductRank({ title, icon: Icon, items, metric }: { title: string; icon: typeof Wand2; items: typeof ranked; metric: "tryOns" | "likes" }) {
  return (
    <Panel>
      <h2 className="flex items-center gap-2 font-serif text-2xl"><Icon className="h-5 w-5 text-gold" />{title}</h2>
      <ol className="mt-4 space-y-3">
        {items.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3">
            <span className="w-5 font-serif text-xl text-gold">{i + 1}</span>
            <img src={p.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <div className="min-w-0 flex-1"><p className="truncate font-serif text-lg leading-tight">{p.name}</p><p className="text-[11px] uppercase text-muted-foreground">{p.brand}</p></div>
            <div className="text-right text-xs text-muted-foreground"><p className="text-sm text-foreground">{p.tryOns.toLocaleString()} try-ons</p><p>{p.likes.toLocaleString()} likes</p></div>
          </li>
        ))}
      </ol>
      <p className="sr-only">Sorted by {metric}</p>
    </Panel>
  );
}

function Insights() {
  const { looks } = useTryOn();
  const community = byLikes(looks.filter((look) => look.shared));
  return (
    <div>
      <PageHeader eyebrow="For brands · Maison Ivoire" title="What shoppers" accent="love" desc="Signals from try-ons, likes and feedback on new pieces." />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProductRank title="Most tried on" icon={Wand2} items={mostTried} metric="tryOns" />
        <ProductRank title="Most liked" icon={Heart} items={mostLiked} metric="likes" />
      </div>

      <section aria-label="Community looks" className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3"><h2 className="font-serif text-3xl">Best looks <em className="text-gold">from the community</em></h2><span className="text-xs text-muted-foreground">{community.length} shared · most liked first</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{community.map((look) => <LookCard key={look.id} look={look} />)}</div>
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
