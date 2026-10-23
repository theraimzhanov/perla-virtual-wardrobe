import { useState } from "react";
import { Shirt, Sparkles, User, Gem, Upload, Camera, X, Plus, Check, Loader2, Download, Share2, Heart, RefreshCw, ChevronRight, Shield, Bell, LogOut, CreditCard, ImagePlus, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import logo from "@/assets/perla-logo.png.asset.json";
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
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-background sm:h-[860px] sm:rounded-[2.5rem] sm:border sm:shadow-soft">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <img src={logo.url} alt="PERLA" className="h-10 w-10 shrink-0 rounded-full object-cover object-[50%_35%]" />
            <span className="font-serif text-2xl tracking-[0.3em] text-gold">PERLA</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShop(true)} className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm">
              <Gem className="h-3.5 w-3.5 text-gold" />
              <span className="font-medium">{credits}</span>
            </button>
            <button onClick={() => setTab("profile")} className="grid h-8 w-8 place-items-center rounded-full bg-gold-gradient text-xs font-semibold text-primary-foreground">NR</button>
          </div>
        </header>

        <main className="no-scrollbar flex-1 overflow-y-auto pb-28">
          {tab === "tryon" && <TryOn spend={spend} />}
          {tab === "studio" && <Studio spend={spend} />}
          {tab === "profile" && <Profile credits={credits} openShop={() => setShop(true)} />}
        </main>

        <nav className="absolute inset-x-0 bottom-0 grid grid-cols-3 border-t bg-background/95 px-4 pb-5 pt-2 backdrop-blur">
          {([
            ["tryon", "Try On", Shirt],
            ["studio", "AI Studio", Sparkles],
            ["profile", "Profile", User],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex flex-col items-center gap-1 py-1 text-[11px] uppercase tracking-widest transition-colors ${tab === id ? "text-foreground" : "text-muted-foreground"}`}>
              <Icon className={`h-5 w-5 ${tab === id ? "text-gold" : ""}`} />
              {label}
              <span className={`h-1 w-1 rounded-full ${tab === id ? "bg-gold" : "bg-transparent"}`} />
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
      <h2 className="font-serif text-xl">{title}</h2>
      {action}
    </div>
  );
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
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return toast.error("Use a JPEG, PNG or WebP photo");
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
    if (!photo) return toast.error("Add your photo first");
    if (!picked.length) return toast.error("Choose at least one piece");
    if (!spend(CREDIT_COST.tryOn)) return;
    setState("loading");
    setTimeout(() => setState("done"), 2200);
  };

  if (state === "done" && photo)
    return (
      <div className="space-y-5 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Your look</p>
          <h1 className="font-serif text-3xl">Parisian Neutrals</h1>
        </div>
        <CompareSlider before={photo} after={modelAfter} />
        <div className="grid grid-cols-4 gap-2">
          {[[Heart, "Save"], [Download, "Download"], [Share2, "Share"], [RefreshCw, "Retry"]].map(([Icon, l]) => {
            const I = Icon as typeof Heart;
            return (
              <button key={l as string} onClick={() => (l === "Retry" ? setState("idle") : toast.success(`${l}d`))} className="flex flex-col items-center gap-1.5 rounded-xl border bg-card py-3 text-xs">
                <I className="h-4 w-4" /> {l as string}
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground">Retrying a failed result is always free.</p>
      </div>
    );

  return (
    <div className="space-y-7 p-5">
      <section>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Step 1</p>
        <SectionTitle title="Your photo" />
        {photo ? (
          <div className="relative overflow-hidden rounded-2xl bg-muted">
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
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-background/90 py-2.5 text-sm backdrop-blur">
                <RefreshCw className="h-4 w-4" /> Change photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
              </label>
              <button onClick={() => setPhoto(null)} className="grid h-10 w-10 place-items-center rounded-full bg-background/90" aria-label="Remove photo">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gold/50 bg-gold-soft/30 p-6 text-center">
            <ImagePlus className="mx-auto h-8 w-8 text-gold" />
            <p className="mt-3 font-serif text-xl">Upload a full-body photo</p>
            <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              <li>Clear photo · Body fully visible</li>
              <li>Good lighting · Fitted clothing</li>
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm text-primary-foreground">
                <Upload className="h-4 w-4" /> Upload
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border bg-card py-3 text-sm">
                <Camera className="h-4 w-4" /> Camera
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={onPhoto} />
              </label>
            </div>
            <button onClick={() => setPhoto(modelBefore)} className="mt-3 text-xs text-gold underline-offset-4 hover:underline">Use a saved photo</button>
          </div>
        )}
      </section>

      <section>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Step 2</p>
        <SectionTitle
          title="Wardrobe"
          action={
            <label className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground">
              <Plus className="h-4 w-4" /> Add clothing
              <input type="file" accept="image/*" className="hidden" onChange={onGarment} />
            </label>
          }
        />
        <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
          {(["All", ...categories] as const).map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs ${filter === c ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
          {items.filter((g) => filter === "All" || g.category === filter).map((g) => {
            const on = selected.includes(g.id);
            return (
              <button key={g.id} onClick={() => toggle(g.id)} className="w-32 shrink-0 text-left">
                <div className={`relative overflow-hidden rounded-xl border-2 transition ${on ? "border-gold" : "border-transparent"}`}>
                  <img src={g.image} alt={g.name} loading="lazy" className="aspect-square w-full bg-muted object-cover" />
                  {on && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-gold text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>}
                </div>
                <p className="mt-1.5 truncate text-sm">{g.name}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{g.category}</p>
              </button>
            );
          })}
          {filter !== "All" && !items.some((g) => g.category === filter) && <p className="py-8 text-sm text-muted-foreground">No {filter.toLowerCase()} yet — add one.</p>}
        </div>
      </section>

      <section>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Step 3</p>
        <SectionTitle title="Outfit" action={<span className="text-xs text-muted-foreground">{picked.length} pieces</span>} />
        <div className="space-y-2">
          {picked.length === 0 && <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Tap pieces above to build your outfit.</p>}
          {picked.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-xl border bg-card p-2">
              <img src={g.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{g.name}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{g.category} · {g.brand}</p>
              </div>
              <button onClick={() => toggle(g.id)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Remove">
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
    <div className="space-y-6 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">AI Studio</p>
        <h1 className="font-serif text-3xl leading-tight">Create a fashion photo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Place your look in any scene.</p>
      </div>
      <div>
        <p className="mb-2 text-sm">Scene</p>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full resize-none rounded-xl border bg-card p-3 text-sm outline-none focus:border-gold" />
      </div>
      <div>
        <p className="mb-2 text-sm">Style</p>
        <div className="grid grid-cols-3 gap-2">
          {studioStyles.map((s) => (
            <button key={s} onClick={() => setStyle(s)} className={`rounded-xl border py-2.5 text-xs ${style === s ? "border-gold bg-gold-soft/50" : "bg-card"}`}>{s}</button>
          ))}
        </div>
      </div>
      <button onClick={run} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-gold" />} Create · {CREDIT_COST.studio} credits
      </button>
      <div>
        <SectionTitle title="Creations" />
        <div className="grid grid-cols-2 gap-3">
          {loading && <div className="grid aspect-[3/4] place-items-center rounded-xl bg-muted"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>}
          {results.map((r, i) => (
            <div key={i} className="overflow-hidden rounded-xl">
              <img src={r} alt="Creation" loading="lazy" className="aspect-[3/4] w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Profile({ credits, openShop }: { credits: number; openShop: () => void }) {
  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gold-gradient font-serif text-2xl text-primary-foreground">NR</div>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-2xl">Nursultan Raimzhanov</h1>
          <p className="text-sm text-muted-foreground">Member since 2026</p>
        </div>
      </div>
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-soft">Balance</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="font-serif text-5xl">{credits}<span className="ml-2 text-base">credits</span></p>
          <button onClick={openShop} className="rounded-full bg-gold-gradient px-4 py-2 text-xs uppercase tracking-widest">Buy</button>
        </div>
        <p className="mt-3 text-xs opacity-70">Try-on {CREDIT_COST.tryOn} · Studio photo {CREDIT_COST.studio}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["24", "Looks"], ["6", "Wardrobe"], ["3", "Photos"]].map(([n, l]) => (
          <div key={l} className="rounded-xl border bg-card py-3"><p className="font-serif text-2xl">{n}</p><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</p></div>
        ))}
      </div>
      <div>
        <SectionTitle title="Recent" />
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-xl border bg-card p-2">
              <img src={h.image} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm">{h.title}</p><p className="text-xs text-muted-foreground">{h.date}</p></div>
              <span className="text-xs text-muted-foreground">{h.credits} credit{h.credits < -1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y rounded-2xl border bg-card">
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
      <div className="w-full rounded-t-3xl bg-background p-6 pb-10 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
        <h2 className="font-serif text-3xl">Add credits</h2>
        <p className="mb-5 text-sm text-muted-foreground">Credits never expire. Failed generations are refunded.</p>
        <div className="space-y-3">
          {creditPacks.map((p) => (
            <button key={p.id} onClick={() => onBuy(p.credits)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${p.popular ? "border-gold bg-gold-soft/40" : "bg-card"}`}>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold">{p.label}{p.popular && " · Popular"}</p>
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
