import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/perla-emblem.svg.asset.json";
import { CompareSlider } from "@/components/perla/CompareSlider";
import { modelBefore, modelAfter } from "@/components/perla/data";
import { Eyebrow } from "@/components/web/ui";
import { SiteFooter } from "@/components/web/SiteFooter";
import { countGeneratedMedia, type GeneratedMedia } from "@/components/web/looks.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PERLA — Virtual Try-On & AI Fashion Studio" },
      { name: "description", content: "Try on clothes virtually, shoot AI editorials, and give brands real demand signals." },
      { property: "og:title", content: "PERLA — Virtual Try-On & AI Fashion Studio" },
      { property: "og:description", content: "Virtual try-on for shoppers, demand intelligence for brands." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Wand2, title: "Virtual try-on", text: "Upload one photo and wear any piece in seconds." },
  { icon: Sparkles, title: "AI Studio", text: "Turn your outfit into an editorial shoot from a prompt." },
  { icon: BarChart3, title: "Brand insights", text: "Brands see what shoppers would buy — and at what price." },
];

function Landing() {
  const nav = useNavigate();
  const [created, setCreated] = useState<GeneratedMedia | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/app" });
    });
  }, [nav]);

  useEffect(() => {
    let alive = true;
    countGeneratedMedia().then((total) => { if (alive) setCreated(total); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 sm:flex sm:justify-between sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img src={logo.url} alt="" className="h-9 w-auto shrink-0 sm:h-11" /><span className="truncate font-serif text-xl tracking-[0.2em] sm:text-2xl sm:tracking-[0.28em]">PERLA</span>
        </div>
        <nav className="flex shrink-0 items-center gap-3 text-sm sm:gap-6">
          <Link to="/app/insights" className="hidden text-muted-foreground hover:text-foreground sm:inline">For brands</Link>
          <Link to="/login" className="whitespace-nowrap rounded-full border border-border px-4 py-2 text-foreground hover:bg-secondary sm:border-0 sm:px-0 sm:py-0 sm:text-muted-foreground">Sign in</Link>
          <Link to="/app" className="hidden whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-primary-foreground sm:inline-block">Open app</Link>
        </nav>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-2 md:py-20">
        <div>
          <Eyebrow>AI fashion discovery</Eyebrow>
          <h1 className="mt-4 font-serif text-5xl leading-[1.02] sm:text-6xl md:text-7xl">Wear it <em className="text-gold">before</em> anyone.</h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">PERLA dresses you in any piece with virtual try-on, and tells brands exactly what you'd love to own.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app/try-on" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-primary-foreground shadow-soft">Try it on <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/mobile" className="rounded-full bg-card px-7 py-3.5 shadow-card">See mobile app</Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-10">
            {[["120k", "try-ons"], ["340", "brands"], [(created?.total ?? 0).toLocaleString(), "images & videos"]].map(([v, l]) => (
              <div key={l} className="min-w-0"><p className="font-serif text-3xl sm:text-4xl">{v}</p><p className="mt-1 max-w-48 text-xs uppercase text-muted-foreground">{l}</p></div>
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-md rounded-[2rem] bg-card p-4 shadow-soft"><CompareSlider before={modelBefore} after={modelAfter} /></div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:px-6 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-[1.75rem] bg-card p-8 shadow-card">
            <f.icon className="h-6 w-6 text-gold" />
            <h3 className="mt-4 font-serif text-2xl">{f.title}</h3>
            <p className="mt-2 text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
      <SiteFooter />
    </div>
  );
}
