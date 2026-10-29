import { createFileRoute } from "@tanstack/react-router";
import { Heart, Ruler, Shirt, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getWeeklyReport, listProductSignals, type ProductSignal } from "@/components/web/looks.functions";
import type { WeeklyReport } from "@/components/web/weekly-insights-rules";
import { PageHeader, Panel, Eyebrow } from "@/components/web/ui";
import { useTryOn } from "@/components/web/TryOnContext";
import { LookCard } from "@/components/web/LookCard";
import { PANEL_BASE, productBase, rankDiscoverProducts, sharedVirtualLooks } from "@/components/web/brand-insights-rules";

export const Route = createFileRoute("/_authenticated/app/insights")({
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


function Insights() {
  const { looks, catalog, photoJobs } = useTryOn();
  const loadSignals = useServerFn(listProductSignals);
  const loadReport = useServerFn(getWeeklyReport);
  const [signals, setSignals] = useState<ProductSignal[] | null>(null);
  const [report, setReport] = useState<WeeklyReport | null | undefined>(undefined);
  const finished = photoJobs.filter((job) => job.status === "completed").length;
  const likeTotal = looks.reduce((sum, look) => sum + look.likes, 0);
  useEffect(() => {
    let alive = true;
    loadSignals().then((rows) => { if (alive) setSignals(rows); }).catch(() => { if (alive) setSignals([]); });
    return () => { alive = false; };
  }, [loadSignals, finished, likeTotal]);
  useEffect(() => {
    let alive = true;
    loadReport().then((r) => { if (alive) setReport(r); }).catch(() => { if (alive) setReport(null); });
    return () => { alive = false; };
  }, [loadReport]);
  // Sample panel of ~100 members, added on top of real signals for the demo.
  const sampleSignals: ProductSignal[] = catalog.map((p, i) => {
    const real = signals?.find((s) => s.id === p.id);
    const base = productBase(i);
    return { id: p.id, tryOns: (real?.tryOns ?? 0) + base.tryOns, likes: (real?.likes ?? 0) + base.likes };
  });
  const ranked = rankDiscoverProducts(catalog, signals === null ? [] : sampleSignals, "tryOns").filter((product) => product.tryOns > 0 || product.likes > 0).slice(0, 8);
  const community = sharedVirtualLooks(looks);
  const panelTryOns = PANEL_BASE.tryOns + (signals ?? []).reduce((s, r) => s + r.tryOns, 0);
  const panelLikes = PANEL_BASE.likes + (signals ?? []).reduce((s, r) => s + r.likes, 0);
  return (
    <div>
      <PageHeader eyebrow="For brands · Maison Ivoire" title="What shoppers" accent="love" desc="Signals from try-ons, likes and feedback on new pieces." />
      <section aria-label="Panel summary" className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[[String(PANEL_BASE.members), "active members"], [panelTryOns.toLocaleString(), "virtual try-ons"], [panelLikes.toLocaleString(), "likes"], ["46%", "would add to wardrobe"]].map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-card p-5 shadow-card"><p className="font-serif text-4xl text-gold">{v}</p><p className="mt-1 text-xs uppercase text-muted-foreground">{l}</p></div>
        ))}
        <p className="col-span-full text-xs text-muted-foreground">Sample panel data for demonstration.</p>
      </section>
      <section aria-label="Discover product rankings">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Most tried on <em className="text-gold">& most liked</em></h2>
        </div>
        {signals !== null && ranked.length === 0 && <p className="border-y py-8 text-center text-sm text-muted-foreground">No try-ons on Discover pieces yet. Rankings appear after the first saved try-on.</p>}
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
        {community.length === 0 && <p className="border-y py-8 text-center text-sm text-muted-foreground">No shared looks yet. Share a try-on photo or video to feature it here.</p>}
      </section>

      <WeeklySections report={report} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function Bar({ label, share, note }: { label: string; share: number; note?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm"><span>{label}</span><span className="tabular-nums text-gold">{share}%</span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gold-gradient" style={{ width: `${share}%` }} /></div>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function WeeklySections({ report }: { report: WeeklyReport | null | undefined }) {
  if (report === undefined) return null;
  const stamp = report ? `Updated weekly · week of ${new Date(report.weekStart + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "Updated every Monday";
  const waiting = "The first weekly report arrives on the next Monday update.";
  return (
    <>
      <Panel className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-serif text-3xl">Trends <em className="text-gold">from feedback</em></h2><p className="mt-1 text-sm text-muted-foreground">How shoppers answered the five try-on questions</p></div>
          <span className="rounded-full border px-3 py-1 text-[10px] uppercase text-muted-foreground">{stamp}</span>
        </div>
        {!report || report.trends.length === 0 ? <div className="mt-5"><Empty text={report ? "No survey answers yet." : waiting} /></div> : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {report.trends.map((t) => (
              <article key={t.question} className="rounded-2xl bg-secondary/60 p-5">
                <div className="flex items-baseline justify-between"><h3 className="font-serif text-xl">{t.title}</h3><span className="text-xs text-muted-foreground">{t.total} answers</span></div>
                <div className="mt-4 space-y-3">{t.options.map((o) => <Bar key={o.label} label={o.label} share={o.share} />)}</div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="flex items-center gap-2 font-serif text-3xl"><Ruler className="h-5 w-5 text-gold" />Fit <em className="text-gold">& sizing risk</em></h2>
          <p className="mt-1 text-sm text-muted-foreground">Discover pieces where shoppers say "too fitted" or "too loose" (3+ answers)</p>
          <div className="mt-5 space-y-5">
            {!report ? <Empty text={waiting} /> : report.fitRisk.length === 0 ? <Empty text="Not enough fit answers yet." /> : report.fitRisk.map((r) => (
              <Bar key={r.product + r.brand} label={`${r.product}${r.brand ? ` · ${r.brand}` : ""}`} share={r.risk} note={`${r.tooFitted} too fitted · ${r.tooLoose} too loose · ${r.answers} answers`} />
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="flex items-center gap-2 font-serif text-3xl"><Shirt className="h-5 w-5 text-gold" />Shadow <em className="text-gold">wardrobe</em></h2>
          <p className="mt-1 text-sm text-muted-foreground">What shoppers try on from outside Discover — demand you don't stock yet</p>
          {!report ? <div className="mt-5"><Empty text={waiting} /></div> : report.shadowWardrobe.total === 0 ? <div className="mt-5"><Empty text="No outside pieces tried on yet." /></div> : (
            <div className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr]">
              <div><p className="font-serif text-6xl leading-none text-gold">{report.shadowWardrobe.total}</p><p className="mt-1 text-xs uppercase text-muted-foreground">outside try-ons</p></div>
              <div className="space-y-3">
                {report.shadowWardrobe.categories.map((c) => <Bar key={c.label} label={c.label} share={c.share} />)}
                <div className="flex flex-wrap gap-2 pt-1">{report.shadowWardrobe.sources.map((s) => <span key={s.label} className="rounded-full bg-secondary px-3 py-1 text-xs">{s.label} · {s.count}</span>)}</div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="mt-6 bg-primary text-primary-foreground">
        <Eyebrow><span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> AI insights · weekly</span></Eyebrow>
        {!report || report.aiInsights.length === 0 ? <p className="mt-4 text-sm opacity-80">{waiting}</p> : (
          <ul className="mt-4 grid gap-4 md:grid-cols-3">{report.aiInsights.map((t) => <li key={t} className="rounded-2xl bg-primary-foreground/10 p-4 font-serif text-lg leading-snug">{t}</li>)}</ul>
        )}
      </Panel>
    </>
  );
}
