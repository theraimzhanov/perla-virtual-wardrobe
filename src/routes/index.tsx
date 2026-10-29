import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Camera, Clock, Heart, PackageX, Ruler, Shirt, Sparkles, Users, Wand2, Images, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/perla-emblem.svg.asset.json";
import demoVideo from "@/assets/try-on-demo.mp4.asset.json";
import silk from "@/assets/community-silk.jpg";
import slip from "@/assets/community-slip.jpg";
import dress from "@/assets/g-dress.jpg";
import trench from "@/assets/g-trench.jpg";
import bag from "@/assets/g-bag.jpg";
import hat from "@/assets/g-hat.jpg";
import classicDress from "@/assets/example-classic-dress.jpg";
import hatDress from "@/assets/example-hat-dress.jpg";
import { useMascotJourney } from "@/components/perla/useMascotJourney";
import { CompareSlider } from "@/components/perla/CompareSlider";
import { modelBefore, modelAfter } from "@/components/perla/data";
import { Eyebrow } from "@/components/web/ui";
import { SiteFooter } from "@/components/web/SiteFooter";
import { countPlatformActivity, type PlatformActivity } from "@/components/web/looks.functions";
import { PANEL_BASE } from "@/components/web/brand-insights-rules";
import { StatStrip } from "@/components/web/StatStrip";
import { DemoApplication } from "@/components/web/DemoApplication";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PERLA — Virtual Try-On & AI Fashion Studio" },
      { name: "description", content: "Try on clothes virtually, create AI fashion photos and videos, and give brands real demand signals." },
      { property: "og:title", content: "PERLA — Virtual Try-On & AI Fashion Studio" },
      { property: "og:description", content: "Wear it before anyone. Virtual try-on for shoppers, demand intelligence for brands." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://studioperla.live/" },
    ],
    links: [{ rel: "canonical", href: "https://studioperla.live/" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"PERLA","url":"https://studioperla.live/","logo":"https://studioperla.live/favicon.svg","email":"raimjanovnursultan@gmail.com"},{"@type":"WebApplication","name":"PERLA","url":"https://studioperla.live/","applicationCategory":"LifestyleApplication","operatingSystem":"Web","description":"Virtual try-on, AI fashion photos and videos, and demand insights for brands.","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}]}) }],
  }),
  component: Landing,
});

const problems = [
  { icon: PackageX, stat: "30%+", title: "Online fashion gets returned", text: "Shoppers can't see how a piece looks on them, so they buy, doubt and send it back." },
  { icon: Ruler, stat: "#1", title: "Fit is the top return reason", text: "Size charts don't show silhouette. Brands learn about fit only after the return arrives." },
  { icon: Clock, stat: "Months", title: "Brands guess demand", text: "Collections are produced before anyone knows what shoppers actually want to wear." },
];

const fun = [
  { icon: Wand2, title: "Wear any piece", text: "Upload one photo and see yourself in new dresses, bags, hats and shoes in seconds." },
  { icon: Camera, title: "Your own photoshoot", text: "AI Studio puts your look on a runway, a street at golden hour or a Riviera terrace." },
  { icon: Heart, title: "Share & get liked", text: "Post your best looks to the community and see what everyone else is wearing." },
];

const insightsFor = (activity: PlatformActivity | null) => [
  [String(PANEL_BASE.members), "members in the panel"],
  [(PANEL_BASE.tryOns + (activity?.tryOns ?? 0)).toLocaleString(), "virtual try-ons"],
  ["46%", "would add the piece"],
  ["50%", "say Moto Jacket runs small"],
];

function Landing() {
  const nav = useNavigate();
  const [activity, setActivity] = useState<PlatformActivity | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const mascotRef = useRef<HTMLImageElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const introDone = useMascotJourney({ heroRef, mascotRef, eyebrowRef, phraseRef, sliderRef });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/app" }); });
  }, [nav]);

  useEffect(() => {
    let alive = true;
    countPlatformActivity().then((total) => { if (alive) setActivity(total); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:flex sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img src={logo.url} alt="" className="h-9 w-auto shrink-0 sm:h-10" /><span className="truncate font-serif text-xl tracking-[0.2em] sm:text-2xl sm:tracking-[0.28em]">PERLA</span>
          </div>
          <nav className="flex shrink-0 items-center gap-3 text-sm sm:gap-6">
            <Button asChild variant="link" className="h-auto p-0 text-muted-foreground"><a href="#demo">Demo</a></Button>
            <a href="#examples" className="hidden text-muted-foreground hover:text-foreground md:inline">Examples</a>
            <a href="#brands" className="hidden text-muted-foreground hover:text-foreground md:inline">For brands</a>
            <Link to="/login" className="whitespace-nowrap rounded-full border border-border px-4 py-2 text-foreground hover:bg-secondary sm:border-0 sm:px-0 sm:py-0 sm:text-muted-foreground">Sign in</Link>
            <Link to="/app" className="hidden whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-primary-foreground sm:inline-block">Open app</Link>
          </nav>
        </div>
      </header>

      <section ref={heroRef} className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-20">
        <img ref={mascotRef} src={logo.url} alt="" aria-hidden className="pointer-events-none absolute left-0 top-0 z-20 h-20 w-20 object-contain opacity-0 drop-shadow-lg" />
        <div>
          <div ref={eyebrowRef} className="inline-block"><Eyebrow>AI fashion discovery</Eyebrow></div>
          <h1 className="mt-2 font-serif text-5xl leading-[1.02] sm:text-6xl md:text-7xl">Wear it <em className="text-gold">before</em> anyone.</h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">See yourself in any new piece <span ref={phraseRef}>with virtual try-on, turn</span> it into an AI photoshoot — and tell brands what you'd truly love to own.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app/try-on" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-primary-foreground shadow-soft">Try it on <ArrowRight className="h-4 w-4" /></Link>
            <a href="#examples" className="rounded-full bg-card px-7 py-3.5 shadow-card">See examples</a>
          </div>
          <StatStrip className="mt-9" items={[
            { value: PANEL_BASE.members, label: "Active users", icon: Users },
            { value: PANEL_BASE.tryOns + (activity?.tryOns ?? 0), label: "Virtual try-ons", icon: Wand2 },
            { value: PANEL_BASE.productsTried + (activity?.productsTried ?? 0), label: "Products tried", icon: Shirt },
            { value: PANEL_BASE.created + (activity?.created ?? 0), label: "Images & videos", icon: Images },
          ]} />
          <p className="mt-3 text-[10px] text-muted-foreground">Demo starting figures + saved platform activity.</p>
        </div>
        <div ref={sliderRef} className="mx-auto w-full max-w-md rounded-[2rem] bg-card p-4 shadow-soft"><CompareSlider before={modelBefore} after={modelAfter} mascot autoPlay delayedMascot introDone={introDone} /></div>
      </section>

      <section id="demo" className="scroll-mt-24 border-y border-border bg-card py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div><Eyebrow>PERLA demo</Eyebrow><h2 className="mt-3 font-serif text-4xl sm:text-5xl">See the look.<br /><em className="text-gold">Meet the possibility.</em></h2>
            <video src={demoVideo.url} poster={modelAfter} controls muted playsInline preload="metadata" aria-label="PERLA fashion demo" className="mt-7 aspect-video w-full rounded-lg bg-muted object-contain" />
            <p className="mt-4 max-w-md text-sm text-muted-foreground">From a single photo to a new look, a fashion film and a clearer picture of what shoppers love.</p>
            <Button asChild variant="link" className="mt-3 h-auto p-0"><Link to="/app/try-on"><Play />Try PERLA yourself <ArrowRight /></Link></Button>
          </div>
          <div className="min-w-0 lg:pt-2"><p className="text-xs uppercase text-stat-mint">For brands & partners</p><h3 className="mt-3 font-serif text-3xl">Bring your brand to PERLA.</h3><p className="mb-6 mt-2 text-sm text-muted-foreground">Apply for a demo of virtual try-on and demand insights for your collection.</p><DemoApplication /></div>
        </div>
      </section>

      <section id="problem" className="scroll-mt-20 bg-secondary/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl sm:text-5xl">Online fashion is a <em className="text-gold">guessing game</em> — for shoppers and brands.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.title} className="rounded-[1.75rem] bg-card p-8 shadow-card">
                <p.icon className="h-6 w-6 text-gold" />
                <p className="mt-5 font-serif text-4xl">{p.stat}</p>
                <h3 className="mt-1 font-serif text-xl">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground"><span className="text-foreground">PERLA's answer:</span> try it on first, and every try-on becomes a private, anonymous signal brands can act on before they produce.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Eyebrow>The fun part</Eyebrow>
        <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Fashion you can <em className="text-gold">play</em> with.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {fun.map((f) => (
            <div key={f.title} className="rounded-[1.75rem] border border-border p-8">
              <f.icon className="h-6 w-6 text-gold" />
              <h3 className="mt-4 font-serif text-2xl">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="examples" className="scroll-mt-20 mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Eyebrow>Made with PERLA</Eyebrow>
        <h2 className="mt-3 font-serif text-4xl sm:text-5xl">A little color.<br /><em className="text-gold">A whole new you.</em></h2>
        <p className="mt-3 text-sm text-muted-foreground">Illustrative fashion samples · virtual try-on, photo & video</p>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <figure className="example-lift overflow-hidden rounded-lg bg-card"><img src={hatDress} alt="Coral dress with a vivid blue wide-brim hat" width={768} height={1024} loading="lazy" className="aspect-[3/4] w-full object-contain" /><figcaption className="border-t p-4"><p className="text-xs uppercase text-stat-sky">Hat & dress</p><p className="mt-1 font-serif text-2xl">A bolder kind of day.</p></figcaption></figure>
          <figure className="example-lift overflow-hidden rounded-lg bg-card"><img src={classicDress} alt="Elegant emerald green classic satin evening dress" width={768} height={1024} loading="lazy" className="aspect-[3/4] w-full object-contain" /><figcaption className="border-t p-4"><p className="text-xs uppercase text-stat-mint">Elegant classic dress</p><p className="mt-1 font-serif text-2xl">Timeless, in emerald.</p></figcaption></figure>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <figure className="overflow-hidden rounded-[1.75rem] bg-card shadow-card">
            <div className="grid grid-cols-2 gap-1"><img src={modelBefore} alt="Original photo" className="aspect-[3/4] w-full object-cover" /><img src={modelAfter} alt="Virtual try-on result" className="aspect-[3/4] w-full object-cover" /></div>
            <figcaption className="p-5"><p className="text-[10px] uppercase text-gold">Virtual try-on</p><p className="mt-1 font-serif text-xl">Before → after in seconds</p></figcaption>
          </figure>
          <figure className="overflow-hidden rounded-[1.75rem] bg-card shadow-card">
            <div className="grid grid-cols-2 gap-1"><img src={silk} alt="AI Studio editorial photo" className="aspect-[3/4] w-full object-cover" /><img src={slip} alt="AI Studio runway photo" className="aspect-[3/4] w-full object-cover" /></div>
            <figcaption className="p-5"><p className="text-[10px] uppercase text-gold">AI Studio photo</p><p className="mt-1 font-serif text-xl">Editorial & runway scenes</p></figcaption>
          </figure>
          <figure className="overflow-hidden rounded-[1.75rem] bg-card shadow-card">
            <video src={demoVideo.url} poster={modelAfter} autoPlay muted loop playsInline className="aspect-[352/232] w-full bg-muted object-cover" />
            <figcaption className="p-5"><p className="text-[10px] uppercase text-gold">AI Studio video</p><p className="mt-1 font-serif text-xl">Your look, walking</p></figcaption>
          </figure>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[{ image: dress, name: "Dress" }, { image: hat, name: "Hat" }, { image: trench, name: "Classic trench" }, { image: bag, name: "Everyday bag" }].map((product) => <figure key={product.name} className="min-w-0"><img src={product.image} alt={product.name} loading="lazy" className="aspect-square w-full rounded-lg bg-card object-contain" /><figcaption className="mt-2 text-sm text-muted-foreground">{product.name}</figcaption></figure>)}
        </div>
       </section>

      <section id="brands" className="scroll-mt-20 bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] opacity-80"><BarChart3 className="h-4 w-4" /> Brand insights · example week</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl sm:text-5xl">Know what sells <em className="text-gold">before</em> you make it.</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {insightsFor(activity).map(([v, l]) => <div key={l} className="rounded-2xl bg-primary-foreground/10 p-6"><p className="font-serif text-4xl text-gold">{v}</p><p className="mt-1 text-xs uppercase opacity-80">{l}</p></div>)}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[[Ruler, "Fit risk", "Moto Leather Jacket: half of shoppers say too fitted — add a size-up note."], [Shirt, "Shadow wardrobe", "Shoes are the most tried category from outside the catalog — a gap to fill."], [Sparkles, "AI insight", "Everyday wear leads at 38%. Versatile pieces beat event looks this week."]].map(([Icon, t, d]) => {
              const I = Icon as typeof Ruler;
              return <div key={t as string} className="rounded-2xl border border-primary-foreground/20 p-6"><I className="h-5 w-5 text-gold" /><h3 className="mt-3 font-serif text-xl">{t as string}</h3><p className="mt-1 text-sm opacity-80">{d as string}</p></div>;
            })}
          </div>
          <p className="mt-4 text-xs opacity-60">Sample panel data for demonstration.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-serif text-4xl sm:text-5xl">Your next look is <em className="text-gold">one photo</em> away.</h2>
        <Link to="/login" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-primary-foreground shadow-soft">Get started free <ArrowRight className="h-4 w-4" /></Link>
      </section>
      <SiteFooter />
    </div>
  );
}
