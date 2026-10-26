import { useState } from "react";
import { Shirt, Sparkles, User, Gem, Upload, Camera, X, Plus, Check, Loader2, Download, Share2, Heart, RefreshCw, ChevronRight, Shield, Bell, LogOut, CreditCard, ImagePlus, Trash2, Search } from "lucide-react";
import { toast, Toaster } from "sonner";
import logo from "@/assets/perla-logo-clean.png.asset.json";
import { CompareSlider } from "./CompareSlider";
import { wardrobe, categories, creditPacks, CREDIT_COST, studioStyles, history, modelBefore, modelAfter, type Garment, type Category } from "./data";

type Tab = "tryon" | "studio" | "profile";

export function PerlaApp() {
  const [tab, setTab] = useState<Tab>("tryon");
  const [credits, setCredits] = useState(12);
  const [shop, setShop] = useState(false);

  const spend = (n: number) => {
    if (credits < n) {
      toast.error("Not enough credits");
      setShop(true);
      return false;
    }
    setCredits((c) => c - n);
    return true;
  };

  return (
    <div className="min-h-screen bg-secondary sm:py-8">
      <Toaster position="top-center" />
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-background sm:h-[860px] sm:rounded-[2.75rem] sm:border sm:shadow-soft">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 pb-2 pt-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={logo.url} alt="PERLA" className="h-11 w-11 shrink-0 rounded-full object-cover object-[50%_25%] scale-125 shadow-card" />
            <div className="min-w-0">
              <span className="font-serif text-2xl leading-none tracking-[0.28em] text-foreground">PERLA</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShop(true)} className="flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm shadow-card">
              <Gem className="h-3.5 w-3.5 text-gold" />
              <span className="font-medium">{credits}</span>
            </button>
            <button onClick={() => setTab("profile")} className="grid h-9 w-9 place-items-center rounded-full bg-gold-gradient text-xs font-semibold text-primary-foreground shadow-card">NR</button>
          </div>
        </header>

        <main className="no-scrollbar flex-1 overflow-y-auto pb-32">
          {tab === "tryon" && <TryOn spend={spend} />}
          {tab === "studio" && <Studio spend={spend} />}
          {tab === "profile" && <Profile credits={credits} openShop={() => setShop(true)} />}
        </main>

        <nav className="absolute inset-x-5 bottom-5 grid grid-cols-3 rounded-full bg-primary px-3 py-2.5 shadow-soft">
          {([
            ["tryon", "Try On", Shirt],
            ["studio", "AI Studio", Sparkles],
            ["profile", "Profile", User],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-[11px] uppercase tracking-widest transition-all ${tab === id ? "bg-card text-foreground shadow-card" : "text-primary-foreground/60"}`}
            >
              <Icon className={`h-4 w-4 ${tab === id ? "text-gold" : ""}`} />
              {label}
            </button>
          ))}
        </nav>

        {shop && <CreditSheet onClose={() => setShop(false)} onBuy={(n) => { setCredits((c) => c + n); setShop(false); toast.success(`${n} credits added`); }} />}
      </div>
    </div>
  );
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-serif text-2xl">{title}</h2>
      {action}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{children}</p>;
}

function TryOn({ spend }: { spend: (n: number) => boolean }) {
  const [photo, setPhoto] = useState<string | null>(modelBefore);
  const [selected, setSelected] = useState<string[]>(["g1", "g2", "g3"]);
  const [filter, setFilter] = useState<Category | "All">("All");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [items, setItems] = useState<Garment[]>(wardrobe);

  const picked = items.filter((g) => selected.includes(g.id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { toast.error("Use a JPEG, PNG or WebP photo"); return; }
    setPhoto(URL.createObjectURL(f));
    setState("idle");
  };
  const onGarment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const g: Garment = { id: crypto.randomUUID(), name: "My Upload", brand: "Personal", category: filter === "All" ? "Tops" : filter, image: URL.createObjectURL(f) };
    setItems((i) => [g, ...i]);
    setSelected((s) => [...s, g.id]);
    toast.success("Saved to your wardrobe");
  };
  const generate = () => {
    if (!photo) { toast.error("Add your photo first"); return; }
    if (!picked.length) { toast.error("Choose at least one piece"); return; }
    if (!spend(CREDIT_COST.tryOn)) return;
    setState("loading");
    setTimeout(() => setState("done"), 2200);
  };

  if (state === "done" && photo)
    return (
      <div className="space-y-5 p-6">
        <div>
          <Eyebrow>Your look</Eyebrow>
          <h1 className="font-serif text-4xl leading-tight">Parisian <em className="text-gold">Neutrals</em></h1>
        </div>
        <CompareSlider before={photo} after={modelAfter} />
        <div className="grid grid-cols-4 gap-2">
          {[[Heart, "Save"], [Download, "Download"], [Share2, "Share"], [RefreshCw, "Retry"]].map(([Icon, l]) => {
            const I = Icon as typeof Heart;
            return (
              <button key={l as string} onClick={() => (l === "Retry" ? setState("idle") : toast.success(`${l}d`))} className="flex flex-col items-center gap-1.5 rounded-2xl bg-card py-3.5 text-xs shadow-card">
                <I className="h-4 w-4 text-gold" /> {l as string}
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground">Retrying a failed result is always free.</p>
      </div>
    );

  return (
    <div className="space-y-8 p-6">
      <section>
        <Eyebrow>Step 1</Eyebrow>
        <SectionTitle title="Your photo" />
        {photo ? (
          <div className="relative overflow-hidden rounded-[2rem] bg-muted shadow-card">
            <img src={photo} alt="You" className="aspect-[3/4] w-full object-cover" />
            {state === "loading" && (
              <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
                  <p className="mt-3 font-serif text-xl">Tailoring your look…</p>
                  <p className="text-xs text-muted-foreground">About 20 seconds</p>
                </div>
              </div>
            )}
            <div className="absolute inset-x-3 bottom-3 flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-card/95 py-2.5 text-sm shadow-card backdrop-blur">
                <RefreshCw className="h-4 w-4" /> Change photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
              </label>
              <button onClick={() => setPhoto(null)} className="grid h-10 w-10 place-items-center rounded-full bg-card/95 shadow-card" aria-label="Remove photo">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-gold/50 bg-gold-soft/40 p-6 text-center">
            <ImagePlus className="mx-auto h-8 w-8 text-gold" />
            <p className="mt-3 font-serif text-xl">Upload a full-body photo</p>
            <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              <li>Clear photo · Body fully visible</li>
              <li>Good lighting · Fitted clothing</li>
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm text-primary-foreground shadow-card">
                <Upload className="h-4 w-4" /> Upload
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-card py-3 text-sm shadow-card">
                <Camera className="h-4 w-4" /> Camera
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={onPhoto} />
              </label>
            </div>
            <button onClick={() => setPhoto(modelBefore)} className="mt-3 text-xs text-gold underline-offset-4 hover:underline">Use a saved photo</button>
          </div>
        )}
      </section>

      <section>
        <Eyebrow>Step 2</Eyebrow>
        <SectionTitle
          title="Wardrobe"
          action={
            <label className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground">
              <Plus className="h-4 w-4" /> Add clothing
              <input type="file" accept="image/*" className="hidden" onChange={onGarment} />
            </label>
          }
        />
        <div className="no-scrollbar -mx-6 mb-4 flex gap-2 overflow-x-auto px-6">
          {(["All", ...categories] as const).map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`shrink-0 rounded-full px-4 py-2 text-xs transition-colors ${filter === c ? "bg-primary text-primary-foreground shadow-card" : "bg-card text-muted-foreground shadow-card"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-2">
          {items.filter((g) => filter === "All" || g.category === filter).map((g) => {
            const on = selected.includes(g.id);
            return (
              <button key={g.id} onClick={() => toggle(g.id)} className="w-36 shrink-0 text-left">
                <div className={`rounded-[1.75rem] bg-card p-2 shadow-card transition ${on ? "ring-2 ring-gold" : ""}`}>
                  <div className="relative overflow-hidden rounded-[1.35rem]">
                    <img src={g.image} alt={g.name} loading="lazy" className="aspect-[4/5] w-full bg-muted object-cover" />
                    <span className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full shadow-card transition ${on ? "bg-gold text-primary-foreground" : "bg-card/90 text-muted-foreground"}`}>
                      {on ? <Check className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                  <div className="px-1.5 pb-1 pt-2">
                    <p className="truncate text-sm font-medium">{g.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{g.brand}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {filter !== "All" && !items.some((g) => g.category === filter) && <p className="py-8 text-sm text-muted-foreground">No {filter.toLowerCase()} yet — add one.</p>}
        </div>
      </section>

      <section>
        <Eyebrow>Step 3</Eyebrow>
        <SectionTitle title="Outfit" action={<span className="text-xs text-muted-foreground">{picked.length} pieces</span>} />
        <div className="space-y-2.5">
          {picked.length === 0 && <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Tap pieces above to build your outfit.</p>}
          {picked.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-2xl bg-card p-2.5 shadow-card">
              <img src={g.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{g.name}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{g.category} · {g.brand}</p>
              </div>
              <button onClick={() => toggle(g.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Remove">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <button onClick={generate} disabled={state === "loading"} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm uppercase tracking-[0.2em] text-primary-foreground shadow-soft disabled:opacity-60">
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-gold" />}
        Generate try-on · {CREDIT_COST.tryOn} credit
      </button>
    </div>
  );
}

function Studio({ spend }: { spend: (n: number) => boolean }) {
  const [style, setStyle] = useState("Editorial");
  const [prompt, setPrompt] = useState("Walking along a Parisian boulevard at golden hour");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([modelAfter]);
  const run = () => {
    if (!spend(CREDIT_COST.studio)) return;
    setLoading(true);
    setTimeout(() => { setResults((r) => [modelAfter, ...r]); setLoading(false); toast.success("New photo ready"); }, 2400);
  };
  return (
    <div className="space-y-7 p-6">
      <div>
        <Eyebrow>AI Studio</Eyebrow>
        <h1 className="font-serif text-4xl leading-tight">Create a <em className="text-gold">fashion photo</em></h1>
        <p className="mt-1 text-sm text-muted-foreground">Place your look in any scene.</p>
      </div>
      <div className="flex items-center gap-3 rounded-full bg-card px-4 py-3 shadow-card">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the scene…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div>
        <p className="mb-2.5 text-sm font-medium">Style</p>
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6">
          {studioStyles.map((s) => (
            <button key={s} onClick={() => setStyle(s)} className={`shrink-0 rounded-full px-4 py-2.5 text-xs transition-colors ${style === s ? "bg-primary text-primary-foreground shadow-card" : "bg-card text-muted-foreground shadow-card"}`}>{s}</button>
          ))}
        </div>
      </div>
      <button onClick={run} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm uppercase tracking-[0.2em] text-primary-foreground shadow-soft disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-gold" />} Create · {CREDIT_COST.studio} credits
      </button>
      <div>
        <SectionTitle title="Creations" />
        <div className="grid grid-cols-2 gap-3">
          {loading && <div className="grid aspect-[3/4] place-items-center rounded-[1.75rem] bg-muted"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>}
          {results.map((r, i) => (
            <div key={i} className="rounded-[1.75rem] bg-card p-2 shadow-card">
              <img src={r} alt="Creation" loading="lazy" className="aspect-[3/4] w-full rounded-[1.35rem] object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Profile({ credits, openShop }: { credits: number; openShop: () => void }) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gold-gradient font-serif text-2xl text-primary-foreground shadow-card">NR</div>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-2xl">Nursultan Raimzhanov</h1>
          <p className="text-sm text-muted-foreground">Member since 2026</p>
        </div>
      </div>
      <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-soft">Balance</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="font-serif text-5xl">{credits}<span className="ml-2 text-base">credits</span></p>
          <button onClick={openShop} className="rounded-full bg-gold-gradient px-5 py-2.5 text-xs uppercase tracking-widest shadow-card">Buy</button>
        </div>
        <p className="mt-3 text-xs opacity-70">Try-on {CREDIT_COST.tryOn} · Studio photo {CREDIT_COST.studio}</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5 text-center">
        {[["24", "Looks"], ["6", "Wardrobe"], ["3", "Photos"]].map(([n, l]) => (
          <div key={l} className="rounded-2xl bg-card py-3.5 shadow-card"><p className="font-serif text-2xl">{n}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</p></div>
        ))}
      </div>
      <div>
        <SectionTitle title="Recent" />
        <div className="space-y-2.5">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-card p-2.5 shadow-card">
              <img src={h.image} alt="" className="h-14 w-11 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{h.title}</p><p className="text-xs text-muted-foreground">{h.date}</p></div>
              <span className="text-xs text-muted-foreground">{h.credits} credit{h.credits < -1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border rounded-[1.75rem] bg-card shadow-card">
        {[[CreditCard, "Purchase history"], [Shield, "Privacy & photos"], [Bell, "Notifications"], [LogOut, "Sign out"]].map(([Icon, l]) => {
          const I = Icon as typeof Bell;
          return (
            <button key={l as string} onClick={() => toast(l as string)} className="flex w-full items-center gap-3 px-4 py-3.5 text-sm">
              <I className="h-4 w-4 text-muted-foreground" /><span className="flex-1 text-left">{l as string}</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CreditSheet({ onClose, onBuy }: { onClose: () => void; onBuy: (n: number) => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full rounded-t-[2.5rem] bg-background p-6 pb-10 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
        <h2 className="font-serif text-3xl">Add credits</h2>
        <p className="mb-5 text-sm text-muted-foreground">Credits never expire. Failed generations are refunded.</p>
        <div className="space-y-3">
          {creditPacks.map((p) => (
            <button key={p.id} onClick={() => onBuy(p.credits)} className={`flex w-full items-center justify-between rounded-[1.75rem] p-4 text-left shadow-card ${p.popular ? "bg-gold-soft/50 ring-2 ring-gold" : "bg-card"}`}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{p.label}{p.popular && " · Popular"}</p>
                <p className="font-serif text-2xl">{p.credits} credits</p>
              </div>
              <span className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">{p.price}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">Demo only — no payment is taken.</p>
      </div>
    </div>
  );
}
