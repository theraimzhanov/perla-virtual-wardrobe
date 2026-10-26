import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Download, Film, Heart, ImagePlus, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CompareSlider } from "@/components/perla/CompareSlider";
import { modelBefore, modelAfter } from "@/components/perla/data";
import demoVideo from "@/assets/try-on-demo.mp4.asset.json";
import demoVideoWebm from "@/assets/try-on-demo.webm.asset.json";
import { useTryOn } from "./TryOnContext";
import { GenerationSkeleton } from "./GenerationSkeleton";
import { ResultFeedback } from "./ResultFeedback";
import { generationIssue, showFeedback } from "./try-on-rules";
import { cn } from "@/lib/utils";

type Phase = "idle" | "loading" | "done";

async function downloadMedia(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Download unavailable");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    toast.error("Couldn't download. Please try again.");
  }
}

export function TryOnExperience({ compact = false }: { compact?: boolean }) {
  const { photo, setPhoto, uploadPhoto, uploadProduct, selected, selectedIds, mode, setMode, personal, setPersonal, removeProduct, preparing, setPreparing } = useTryOn();
  const [photoPhase, setPhotoPhase] = useState<Phase>("idle");
  const [videoPhase, setVideoPhase] = useState<Phase>("idle");
  const [photoDialog, setPhotoDialog] = useState(false);
  const [likedPhoto, setLikedPhoto] = useState(false);
  const [likedVideo, setLikedVideo] = useState(false);
  const [compare, setCompare] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const productInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLElement>(null);
  const selectionKey = selected.map((item) => `${item.id}:${item.image}`).join("|");

  useEffect(() => {
    setPhotoPhase("idle");
    setVideoPhase("idle");
    setLikedPhoto(false);
    setLikedVideo(false);
    setCompare(false);
    setVideoError(false);
  }, [photo, selectionKey, mode]);

  useEffect(() => {
    if (!preparing) return;
    if (!photo) setPhotoDialog(true);
    const timer = setTimeout(() => setPreparing(false), 1100);
    return () => clearTimeout(timer);
  }, [preparing, photo, setPreparing]);

  useEffect(() => {
    if (photoPhase !== "loading") return;
    const timer = setTimeout(() => setPhotoPhase("done"), 2800);
    return () => clearTimeout(timer);
  }, [photoPhase]);

  useEffect(() => {
    if (videoPhase !== "loading") return;
    const timer = setTimeout(() => setVideoPhase("done"), 3200);
    return () => clearTimeout(timer);
  }, [videoPhase]);

  useEffect(() => {
    if (photoPhase === "loading") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (videoPhase === "loading") videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [photoPhase, videoPhase]);

  const acceptFile = (event: ChangeEvent<HTMLInputElement>, kind: "photo" | "product") => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (kind === "photo") { uploadPhoto(file); setPhotoDialog(false); }
    else uploadProduct(file);
  };

  const generate = () => {
    const issue = generationIssue(photo, selected);
    if (issue === "photo") { setPhotoDialog(true); return; }
    if (issue === "product") { toast.error("Select a product in Discover or upload your own."); return; }
    setPreparing(false);
    setPhotoPhase("loading");
    setVideoPhase("idle");
    setLikedPhoto(false);
    setLikedVideo(false);
  };

  const busy = photoPhase === "loading" || videoPhase === "loading";
  const hasResult = photoPhase === "done";
  return (
    <div className="min-w-0">
      <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload your photo" className="hidden" onChange={(event) => acceptFile(event, "photo")} />
      <input ref={productInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload product photo" className="hidden" onChange={(event) => acceptFile(event, "product")} />

      <div className={cn("grid items-start gap-7", !compact && "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-10")}>
        <section aria-label="Your photo">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-2xl">Your photo</h2><span className="text-xs text-muted-foreground">01</span></div>
          {photo ? (
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <img src={photo} alt="Your uploaded photo" className="aspect-[3/4] w-full object-cover" />
              <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
                <Button variant="secondary" disabled={busy} onClick={() => photoInput.current?.click()} className="flex-1 rounded-full bg-background/95 shadow-card"><RefreshCw />Change photo</Button>
                <Button size="icon" variant="secondary" disabled={busy} aria-label="Remove photo" title="Remove photo" onClick={() => setPhoto(null)} className="shrink-0 rounded-full bg-background/95"><X /></Button>
              </div>
            </div>
          ) : (
            <div className="grid aspect-[3/4] place-items-center rounded-2xl border border-dashed border-gold/50 bg-secondary/60 px-6 text-center">
              <div><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-card"><ImagePlus className="h-7 w-7 text-gold" /></div><h3 className="mt-5 font-serif text-3xl">Start with you</h3><p className="mt-2 text-sm text-muted-foreground">Your full-body photo</p><Button onClick={() => photoInput.current?.click()} className="mt-5 rounded-full"><Upload />Upload photo</Button><div><Button variant="link" className="mt-2 text-xs text-muted-foreground" onClick={() => setPhoto(modelBefore)}>Use sample photo</Button></div></div>
            </div>
          )}
        </section>

        <section aria-label="Selected products" className="min-w-0">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-2xl">Your selection</h2><span className="text-xs text-muted-foreground">02</span></div>
          <div className="mb-5 flex w-full rounded-full bg-secondary p-1" role="group" aria-label="Product source">
            <Button variant="ghost" disabled={busy} aria-pressed={mode === "discover"} onClick={() => setMode("discover")} className={cn("h-auto flex-1 rounded-full px-3 py-2 text-xs", mode === "discover" && "bg-card shadow-card hover:bg-card")}>From Discover {selectedIds.length > 0 && <span>· {selectedIds.length}</span>}</Button>
            <Button variant="ghost" disabled={busy} aria-pressed={mode === "personal"} onClick={() => setMode("personal")} className={cn("h-auto flex-1 rounded-full px-3 py-2 text-xs", mode === "personal" && "bg-card shadow-card hover:bg-card")}>My product</Button>
          </div>
          <div className="space-y-3">
            {selected.map((product) => <div key={product.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-card p-3 shadow-card"><img src={product.image} alt={product.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="text-[10px] uppercase text-muted-foreground">{product.brand}</p><p className="break-words font-serif text-xl leading-tight">{product.name}</p><p className="mt-1 text-xs text-gold">{product.style}</p></div><Button size="icon" variant="ghost" title={`Remove ${product.name}`} aria-label={`Remove ${product.name}`} disabled={busy} className="shrink-0 rounded-full" onClick={() => mode === "personal" ? setPersonal(null) : removeProduct(product.id)}><X /></Button></div>)}
            {selected.length === 0 && (mode === "discover" ? <div className="border-y py-8 text-center"><Sparkles className="mx-auto h-6 w-6 text-gold" /><p className="mt-3 font-serif text-xl">Something new awaits</p><Button asChild variant="link" className="mt-2"><Link to="/app">Explore Discover</Link></Button></div> : <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-secondary/50"><Button variant="ghost" onClick={() => productInput.current?.click()}><ImagePlus />Upload product photo</Button></div>)}
          </div>
          {(mode === "discover" || personal) && <Button variant="outline" disabled={busy} onClick={() => productInput.current?.click()} className="mt-4 w-full rounded-full border-dashed"><Upload />{personal && mode === "personal" ? "Change product photo" : "Upload my own product"}</Button>}
          <Button disabled={busy || preparing} onClick={generate} className="mt-6 h-auto w-full whitespace-normal rounded-full px-5 py-4 shadow-soft"><Sparkles />{photoPhase === "loading" ? "Creating your look…" : hasResult ? "Generate again" : "Generate try-on"}</Button>
          <div className="mt-7 flex items-center gap-3 border-t pt-5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-soft"><Film className="h-4 w-4 text-gold" /></div><div><p className="font-serif text-lg">Then, see it in motion</p><p className="text-xs text-muted-foreground">Photo → Video</p></div></div>
        </section>
      </div>

      {(preparing || photoPhase !== "idle") && <section ref={resultRef} aria-label="Try-on result" className="mt-12 scroll-mt-24 border-t pt-7">
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-serif text-3xl">Your new look</h2><span className="rounded-full border px-3 py-1 text-[10px] uppercase text-muted-foreground">Sample preview</span></div>
        {preparing || photoPhase === "loading" ? <GenerationSkeleton kind={preparing ? "prepare" : "photo"} className="mx-auto max-w-md" /> : <>
          <div className={cn("grid items-start gap-7", !compact && "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-10")}>
            <div className="min-w-0">{compare && photo ? <CompareSlider before={photo} after={modelAfter} /> : <img src={modelAfter} alt="Sample generated try-on look" className="aspect-[3/4] w-full rounded-2xl object-cover" />}
              <div className="mt-3 flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Like picture" title="Like picture" aria-pressed={likedPhoto} onClick={() => setLikedPhoto((value) => !value)} className={cn("rounded-full", likedPhoto && "border-gold text-gold")}><Heart className={likedPhoto ? "fill-current" : ""} /></Button><Button size="icon" variant="outline" aria-label="Download picture" title="Download picture" onClick={() => downloadMedia(modelAfter, "perla-try-on.jpg")} className="rounded-full"><Download /></Button><Button variant="outline" aria-pressed={compare} onClick={() => setCompare((value) => !value)} className="ml-auto rounded-full text-xs">{compare ? "View picture" : "Compare"}</Button></div>
            </div>
            <div className="min-w-0"><p className="text-xs uppercase text-gold">Photo complete <Check className="ml-1 inline h-3 w-3" /></p><h3 className="mt-2 font-serif text-3xl">A different point of view.</h3>{showFeedback(mode) && <ResultFeedback key={`photo:${selectionKey}`} kind="photo" />}<Button disabled={videoPhase === "loading"} onClick={() => { setVideoError(false); setVideoPhase("loading"); }} className="mt-7 h-auto w-full rounded-full py-4"><Film />{videoPhase === "loading" ? "Creating your video…" : videoPhase === "done" ? "Generate video again" : "Generate video"}</Button></div>
          </div>
        </>}
      </section>}

      {videoPhase !== "idle" && <section ref={videoRef} aria-label="Video result" className="mt-12 scroll-mt-24 border-t pt-7"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-serif text-3xl">Your look, in motion</h2><span className="rounded-full border px-3 py-1 text-[10px] uppercase text-muted-foreground">Sample preview</span></div>{videoPhase === "loading" ? <GenerationSkeleton kind="video" className="mx-auto max-w-md" /> : <div className={cn("grid items-start gap-7", !compact && "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-10")}>
        <div><div className="overflow-hidden rounded-2xl bg-secondary">{videoError ? <div className="grid aspect-[3/4] place-items-center p-6 text-center"><div><p className="text-sm">Video couldn't load.</p><Button variant="outline" className="mt-3" onClick={() => setVideoError(false)}><RefreshCw />Retry video</Button></div></div> : <video poster={modelAfter} controls playsInline loop preload="auto" onError={() => setVideoError(true)} className="aspect-[3/4] w-full object-contain" aria-label="Generated sample try-on video"><source src={demoVideoWebm.url} type="video/webm" /><source src={demoVideo.url} type="video/mp4" /></video>}</div><div className="mt-3 flex gap-2"><Button size="icon" variant="outline" aria-label="Like video" title="Like video" aria-pressed={likedVideo} onClick={() => setLikedVideo((value) => !value)} className={cn("rounded-full", likedVideo && "border-gold text-gold")}><Heart className={likedVideo ? "fill-current" : ""} /></Button><Button size="icon" variant="outline" aria-label="Download video" title="Download video" onClick={() => downloadMedia(demoVideo.url, "perla-try-on.mp4")} className="rounded-full"><Download /></Button></div></div>
        <div><p className="text-xs uppercase text-gold">Video complete <Check className="ml-1 inline h-3 w-3" /></p><h3 className="mt-2 font-serif text-3xl">Every little movement.</h3>{showFeedback(mode) && <ResultFeedback key={`video:${selectionKey}`} kind="video" />}</div>
      </div>}</section>}

      <Dialog open={photoDialog} onOpenChange={setPhotoDialog}><DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-7"><div className="grid h-12 w-12 place-items-center rounded-full bg-gold-soft"><ImagePlus className="h-6 w-6 text-gold" /></div><DialogTitle className="font-serif text-3xl font-normal">Let's see it on you</DialogTitle><DialogDescription>Add your photo to try on your selection.</DialogDescription><Button onClick={() => photoInput.current?.click()} className="h-auto rounded-full py-3"><Upload />Upload your photo</Button><Button variant="outline" onClick={() => { setPhoto(modelBefore); setPhotoDialog(false); }} className="rounded-full">Use sample photo</Button></DialogContent></Dialog>
    </div>
  );
}