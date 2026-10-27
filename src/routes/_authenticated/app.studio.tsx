import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BookmarkPlus, Check, Download, Film, Heart, Image as ImageIcon, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTryOn } from "@/components/web/TryOnContext";
import { GenerationSkeleton } from "@/components/web/GenerationSkeleton";
import { sampleLookVideo, type Look } from "@/components/web/looks";
import { PageHeader, Panel, Pill, GoldButton } from "@/components/web/ui";

export const Route = createFileRoute("/_authenticated/app/studio")({
  head: () => ({
    meta: [
      { title: "AI Studio — PERLA" },
      { name: "description", content: "Restyle your virtual try-on photos and videos into editorial scenes." },
      { property: "og:title", content: "AI Studio — PERLA" },
      { property: "og:description", content: "Pick a try-on look, choose a scene and create new images and videos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

const styles = ["Street", "Runway", "Golden Hour", "Editorial", "Studio White", "Riviera", "Night Out"];
type Creation = { id: string; kind: "photo" | "video"; image: string; style: string; prompt: string; base: string; liked: boolean; saved: boolean };

function Studio() {
  const { looks, addLook } = useTryOn();
  const mine = looks.filter((l) => l.mine);
  const [baseId, setBaseId] = useState<string | null>(mine[0]?.id ?? null);
  const base = mine.find((l) => l.id === baseId) ?? mine[0];
  const [style, setStyle] = useState("Golden Hour");
  const [prompt, setPrompt] = useState("Walking along the Seine at sunset, soft wind, film grain");
  const [output, setOutput] = useState<"photo" | "video">("photo");
  const [busy, setBusy] = useState<null | "photo" | "video">(null);
  const [creations, setCreations] = useState<Creation[]>([]);

  const generate = () => {
    if (!base) return;
    const kind = output;
    setBusy(kind);
    setTimeout(() => {
      setCreations((all) => [{ id: `s${Date.now()}`, kind, image: base.image, style, prompt, base: base.product ?? base.title, liked: false, saved: false }, ...all]);
      setBusy(null);
    }, 2200);
  };
  const update = (id: string, patch: Partial<Creation>) => setCreations((all) => all.map((c) => c.id === id ? { ...c, ...patch } : c));
  const save = (c: Creation) => {
    addLook({ id: c.id, title: `${c.style} · ${c.base}`, product: c.base, kind: c.kind, image: c.image, ...(c.kind === "video" ? { video: sampleLookVideo } : {}), source: "discover" });
    update(c.id, { saved: true });
    toast.success("Saved to your collection in Profile");
  };

  return (
    <div>
      <PageHeader eyebrow="AI Studio" title="Your look," accent="reimagined" desc="Choose a try-on you created, pick a scene, and PERLA restyles it as a new photo or video." />
      <Panel className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">1. Choose a generated look</h2>
        {mine.length === 0 ? <p className="text-sm text-muted-foreground">Create a virtual try-on first — your photos and videos will appear here.</p> : (
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {mine.map((l: Look) => (
              <button key={l.id} onClick={() => setBaseId(l.id)} aria-pressed={base?.id === l.id} className={cn("relative w-28 shrink-0 snap-start overflow-hidden rounded-lg border-2 text-left", base?.id === l.id ? "border-gold" : "border-transparent")}>
                <img src={l.image} alt={l.title} className="aspect-[3/4] w-full object-cover" />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-background/90 p-1">{l.kind === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}</span>
                {base?.id === l.id && <span className="absolute right-1.5 top-1.5 rounded-full bg-gold p-1 text-primary-foreground"><Check className="h-3 w-3" /></span>}
                <p className="truncate p-1.5 text-xs">{l.product ?? l.title}</p>
              </button>
            ))}
          </div>
        )}
        <h2 className="mb-3 mt-6 font-serif text-2xl">2. Scene & prompt</h2>
        <div className="mb-3 flex flex-wrap gap-2">{styles.map((s) => <Pill key={s} active={s === style} onClick={() => setStyle(s)}>{s}</Pill>)}</div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} className="w-full resize-none rounded-2xl bg-secondary p-4 font-serif text-lg outline-none" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pill active={output === "photo"} onClick={() => setOutput("photo")}><ImageIcon className="mr-1 inline h-4 w-4" />Image</Pill>
          <Pill active={output === "video"} onClick={() => setOutput("video")}><Film className="mr-1 inline h-4 w-4" />Video</Pill>
          <GoldButton className="ml-auto" onClick={generate} disabled={!base || !!busy}><Sparkles className="h-4 w-4" /> {busy ? "Creating…" : `Create ${output === "photo" ? "image" : "video"}`}</GoldButton>
        </div>
      </Panel>
      <h2 className="mb-4 font-serif text-3xl">Your creations</h2>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {busy && <GenerationSkeleton kind={busy} className="aspect-[3/4]" />}
        {!busy && creations.length === 0 && <p className="text-sm text-muted-foreground">New images and videos will appear here.</p>}
        {creations.map((c) => (
          <article key={c.id} aria-label={`${c.style} creation`} className="overflow-hidden rounded-lg bg-card shadow-card">
            <div className="aspect-[3/4] bg-secondary">
              {c.kind === "video" ? (
                <video poster={c.image} controls playsInline loop className="h-full w-full object-contain">
                  <source src={sampleLookVideo.webm} type="video/webm" /><source src={sampleLookVideo.mp4} type="video/mp4" />
                </video>
              ) : <img src={c.image} alt={`${c.style} ${c.base}`} className="h-full w-full object-cover" />}
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-gold">{c.style} · {c.kind === "video" ? "Video" : "Image"}</p>
              <p className="font-serif text-lg leading-tight">{c.base}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{c.prompt}</p>
              <div className="mt-3 flex gap-2">
                <Button size="icon" variant="ghost" aria-label="Like" aria-pressed={c.liked} onClick={() => update(c.id, { liked: !c.liked })} className={cn("h-8 w-8 rounded-full", c.liked && "text-gold")}><Heart className={c.liked ? "fill-current" : ""} /></Button>
                <Button size="icon" variant="outline" aria-label="Save to collection" title="Save to collection" disabled={c.saved} onClick={() => save(c)} className="h-8 w-8 rounded-full">{c.saved ? <Check /> : <BookmarkPlus />}</Button>
                <Button size="icon" variant="outline" asChild className="h-8 w-8 rounded-full"><a href={c.kind === "video" ? sampleLookVideo.mp4 : c.image} download aria-label="Download"><Download /></a></Button>
                <Button size="icon" variant="outline" aria-label="Delete" onClick={() => setCreations((all) => all.filter((x) => x.id !== c.id))} className="ml-auto h-8 w-8 rounded-full text-destructive"><Trash2 /></Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
