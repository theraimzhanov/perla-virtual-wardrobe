import { useEffect, useState } from "react";
import { Shirt, Sparkles, User, Search, Heart } from "lucide-react";
import { Toaster } from "sonner";
import logo from "@/assets/perla-logo-clean.png.asset.json";
import { Button } from "@/components/ui/button";
import { TryOnExperience } from "@/components/web/TryOnExperience";
import { GenerationSkeleton } from "@/components/web/GenerationSkeleton";
import { studioStyles, history, modelAfter } from "./data";
import { cn } from "@/lib/utils";

type Tab = "tryon" | "studio" | "profile";

export function PerlaApp() {
  const [tab, setTab] = useState<Tab>("tryon");
  return (
    <div className="min-h-screen bg-secondary sm:py-8">
      <Toaster position="top-center" />
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-background sm:h-[860px] sm:rounded-[2.75rem] sm:border sm:shadow-soft">
        <header className="flex items-center justify-between gap-3 px-6 pb-2 pt-5">
          <div className="flex items-center gap-2.5"><img src={logo.url} alt="PERLA" className="h-11 w-11 shrink-0 rounded-full object-cover object-[50%_25%] scale-125 shadow-card" /><span className="font-serif text-2xl">PERLA</span></div>
          <Button size="icon" onClick={() => setTab("profile")} title="Profile" aria-label="Profile" className="rounded-full bg-gold-gradient text-xs text-primary-foreground">NR</Button>
        </header>
        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-32 pt-6">
          {tab === "tryon" && <><p className="text-[10px] uppercase text-gold">Virtual try-on</p><h1 className="mb-7 font-serif text-4xl">See it on <em className="text-gold">you</em></h1><TryOnExperience compact /></>}
          {tab === "studio" && <Studio />}
          {tab === "profile" && <Profile />}
        </main>
        <nav className="absolute inset-x-5 bottom-5 grid grid-cols-3 rounded-full bg-primary px-3 py-2.5 shadow-soft">
          {([["tryon", "Try On", Shirt], ["studio", "AI Studio", Sparkles], ["profile", "Profile", User]] as const).map(([id, label, Icon]) => <Button key={id} variant="ghost" onClick={() => setTab(id)} className={cn("h-auto gap-1.5 rounded-full px-1 py-3 text-[10px] uppercase text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground", tab === id && "bg-card text-foreground shadow-card hover:bg-card hover:text-foreground")}><Icon className={tab === id ? "text-gold" : ""} />{label}</Button>)}
        </nav>
      </div>
    </div>
  );
}

function Studio() {
  const [style, setStyle] = useState("Editorial");
  const [prompt, setPrompt] = useState("Walking along a Parisian boulevard at golden hour");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([modelAfter]);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => { setResults((current) => [modelAfter, ...current]); setLoading(false); }, 2400);
    return () => clearTimeout(timer);
  }, [loading]);
  return <div className="space-y-6"><div><p className="text-[10px] uppercase text-gold">AI Studio</p><h1 className="font-serif text-4xl">Create a <em className="text-gold">fashion photo</em></h1></div><div className="flex items-center gap-3 rounded-full bg-card px-4 py-3 shadow-card"><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><input aria-label="Scene prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} className="w-full bg-transparent text-sm outline-none" /></div><div className="flex flex-wrap gap-2">{studioStyles.map((item) => <Button key={item} variant={style === item ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setStyle(item)}>{item}</Button>)}</div><Button disabled={loading} onClick={() => setLoading(true)} className="h-auto w-full rounded-full py-4"><Sparkles />{loading ? "Creating your photo…" : "Generate look"}</Button><h2 className="font-serif text-2xl">Creations</h2><div className="grid grid-cols-2 gap-3">{loading && <GenerationSkeleton />}{results.map((image, index) => <img key={index} src={image} alt="Sample studio creation" className="aspect-[3/4] w-full rounded-xl object-cover" />)}</div></div>;
}

function Profile() {
  return <div className="space-y-6"><div className="flex items-center gap-3"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold-gradient font-serif text-2xl text-primary-foreground">NR</div><div className="min-w-0"><h1 className="font-serif text-2xl leading-tight">Nursultan Raimzhanov</h1><p className="text-xs text-muted-foreground">Member since 2026</p></div></div><div className="grid grid-cols-3 gap-2">{[["24", "Looks"], ["6", "Likes"], ["3", "Photos"]].map(([count, label]) => <div key={label} className="rounded-lg bg-card py-4 text-center shadow-card"><p className="font-serif text-2xl">{count}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div><h2 className="font-serif text-2xl">Recent looks</h2><div className="space-y-3">{history.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card"><img src={item.image} alt={item.title} className="h-16 w-12 rounded-md object-cover" /><div className="min-w-0 flex-1"><p className="font-serif text-xl">{item.title}</p><p className="text-xs text-muted-foreground">{item.date}</p></div><Heart className="h-4 w-4 text-gold" /></div>)}</div></div>;
}
