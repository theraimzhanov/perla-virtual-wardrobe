import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Download, Film, Heart, ImagePlus, LoaderCircle, RefreshCw, Send, Sparkles, Upload, X } from "lucide-react";
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
import { generationIssue, lookSource, showFeedback } from "./try-on-rules";
import { sampleLookVideo, sourceFromFeedback, type LookSource } from "./looks";
import { cn } from "@/lib/utils";
import { validateImage } from "./upload-rules";
import { usePhotoGeneration } from "./usePhotoGeneration";
import { useVideoGeneration } from "./useVideoGeneration";
import type { AccessoryFit } from "./generation-rules";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const { userId, selectedInputProductId, photo, photoId, setPhoto, uploadPhoto, uploadProduct, selected, selectedIds, mode, setMode, personal, setPersonal, removeProduct, preparing, setPreparing, addLook, shareLook, looks, likeLook, updateLookSource, markTried, savingInputs, inputError, retryInputs, signedIn, photoJobs, refreshPhotoJobs, generationHistoryError } = useTryOn();
  const [lookId, setLookId] = useState(0);
  const [demoPhotoPhase, setDemoPhotoPhase] = useState<Phase>("idle");
  const [accessoryFit, setAccessoryFit] = useState<AccessoryFit | null>(null);
  const [demoVideoPhase, setVideoPhase] = useState<Phase>("idle");
  const [photoDialog, setPhotoDialog] = useState(false);
  const [productSource, setProductSource] = useState<LookSource>(lookSource(mode));
  const likedVideo = looks.some((look) => look.id === `v${lookId}` && look.liked);
  const [compare, setCompare] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const productInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLElement>(null);
  const selectionKey = selected.map((item) => `${item.id}:${item.image}`).join("|");
  const restored = signedIn && photoId && selectedInputProductId ? photoJobs.find((job) => job.photoId === photoId && job.productId === selectedInputProductId && (mode === "discover" ? job.source === "discover" : job.source !== "discover")) : undefined;
  const generation = usePhotoGeneration(userId, `${photoId}:${selectedInputProductId}:${mode}`, restored);
  const photoPhase = signedIn ? generation.phase : demoPhotoPhase;
  const resultImage = generation.job?.image ?? null;
  const photoLookId = generation.job ? `job:${generation.job.id}` : `p${lookId}`;
  const likedPhoto = looks.some((look) => look.id === photoLookId && look.liked);
  const realVideo = useVideoGeneration(userId, signedIn && generation.job?.status === "completed" ? generation.job.id : null);
  const videoPhase = (signedIn ? realVideo.phase : demoVideoPhase) as Phase | "failed";
  const videoSrc = signedIn ? realVideo.video : null;
  const startVideo = () => { setVideoError(false); if (signedIn) void realVideo.start(); else setVideoPhase("loading"); };

  useEffect(() => {
    setDemoPhotoPhase("idle");
    setVideoPhase("idle");
    setProductSource(lookSource(mode));
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
    if (signedIn || demoPhotoPhase !== "loading") return;
    const timer = setTimeout(() => setDemoPhotoPhase("done"), 2800);
    return () => clearTimeout(timer);
  }, [signedIn, demoPhotoPhase]);

  useEffect(() => {
    if (signedIn || demoVideoPhase !== "loading") return;
    const timer = setTimeout(() => setVideoPhase("done"), 3200);
    return () => clearTimeout(timer);
  }, [signedIn, demoVideoPhase]);

  useEffect(() => {
    if (photoPhase === "loading") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (videoPhase === "loading") videoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [photoPhase, videoPhase]);

  const acceptFile = async (event: ChangeEvent<HTMLInputElement>, kind: "photo" | "product") => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try { validateImage(file); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Choose a valid image."); return; }
    const saved = await (kind === "photo" ? uploadPhoto(file) : uploadProduct(file));
    if (saved && kind === "photo") setPhotoDialog(false);
  };

  const generate = () => {
    if (savingInputs || inputError) return;
    const issue = generationIssue(photo, selected);
    if (issue === "photo") { setPhotoDialog(true); return; }
    if (issue === "product") { toast.error("Select a product in Discover or upload your own."); return; }
    setPreparing(false);
    setLookId(Date.now());
    setVideoPhase("idle");
    if (!signedIn) { setDemoPhotoPhase("loading"); return; }
    void generation.start(accessoryFit);
  };

  const lookTitle = selected[0]?.name ?? "New look";
  useEffect(() => {
    if (photoPhase !== "done") return;
    if (mode === "discover") markTried(selectedIds);
    if (signedIn) { if (resultImage && generation.job) void refreshPhotoJobs(); }
    else addLook({ id: `p${lookId}`, title: lookTitle, product: lookTitle, kind: "photo", image: modelAfter, source: productSource });
  }, [photoPhase, resultImage]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (videoPhase === "done") addLook({ id: `v${lookId}`, title: lookTitle, product: lookTitle, kind: "video", image: signedIn ? resultImage ?? modelAfter : modelAfter, video: videoSrc ? { mp4: videoSrc } : sampleLookVideo, source: productSource }); }, [videoPhase, videoSrc]); // eslint-disable-line react-hooks/exhaustive-deps
  const recordSource = (question: string, answer: string) => {
    if (mode !== "personal" || question !== "where") return;
    const source = sourceFromFeedback(answer);
    if (!source) return;
    setProductSource(source);
    updateLookSource([photoLookId, `v${lookId}`], source);
  };
  const isShared = (id: string) => looks.some((look) => look.id === id && look.shared);
  const ShareButton = ({ id }: { id: string }) => <Button variant="outline" disabled={isShared(id)} onClick={() => { shareLook(id); toast.success("Shared to Brand Insights"); }} className="rounded-full text-xs"><Send />{isShared(id) ? "Shared" : "Share to Brand Insights"}</Button>;
  const busy = savingInputs || photoPhase === "loading" || videoPhase === "loading";
  const hasResult = photoPhase === "done";
  return (
    <div className="min-w-0">
      <input ref={photoInput} type="file" disabled={busy} accept="image/jpeg,image/png,image/webp" aria-label="Upload your photo" className="hidden" onChange={(event) => { void acceptFile(event, "photo"); }} />
      <input ref={productInput} type="file" disabled={busy} accept="image/jpeg,image/png,image/webp" aria-label="Upload product photo" className="hidden" onChange={(event) => { void acceptFile(event, "product"); }} />
      {savingInputs && <div role="status" className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 motion-safe:animate-spin" />Saving your selection…</div>}
      {generationHistoryError && <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 text-sm text-destructive">{generationHistoryError}<Button variant="outline" size="sm" onClick={() => { void refreshPhotoJobs(); }}><RefreshCw />Retry</Button></div>}
      {generation.error && <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 border-l-2 border-destructive pl-4 text-sm"><p className="text-destructive">{generation.error}</p>{generation.job && photoPhase === "loading" && <Button variant="outline" size="sm" onClick={generation.retryStatus}><RefreshCw />Check status</Button>}</div>}
      {inputError && <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 border-l-2 border-destructive pl-4 text-sm"><p className="text-destructive">{inputError}</p>{signedIn && <Button variant="outline" size="sm" onClick={retryInputs} disabled={savingInputs}><RefreshCw />Retry</Button>}</div>}
      {!signedIn && !savingInputs && <div className="mb-5 border-y py-3"><Button asChild variant="outline"><Link to="/login"><Upload />Sign in to save photos</Link></Button></div>}

      <div className={cn("grid items-start gap-7", !compact && "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-10")}>
        <section aria-label="Your photo">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-2xl">Your photo</h2><span className="text-xs text-muted-foreground">01</span></div>
          {photo ? (
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <div className="aspect-[3/4] w-full">
                <img src={photo} alt="Your uploaded photo" className="h-full w-full object-contain" />
              </div>
              <div className="flex items-center gap-2 p-3">
                <Button variant="secondary" disabled={busy || !signedIn} onClick={() => photoInput.current?.click()} className="flex-1 rounded-full bg-background/95 shadow-card"><RefreshCw />Change photo</Button>
                <Button size="icon" variant="secondary" disabled={busy} aria-label="Remove photo" title="Remove photo" onClick={() => setPhoto(null)} className="shrink-0 rounded-full bg-background/95"><X /></Button>
              </div>
            </div>
          ) : (
            <div className="grid aspect-[3/4] place-items-center rounded-2xl border border-dashed border-gold/50 bg-secondary/60 px-6 text-center">
              <div><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-card"><ImagePlus className="h-7 w-7 text-gold" /></div><h3 className="mt-5 font-serif text-3xl">Start with you</h3><p className="mt-2 text-sm text-muted-foreground">Your full-body photo</p><Button disabled={busy || !signedIn} onClick={() => photoInput.current?.click()} className="mt-5 rounded-full"><Upload />Upload photo</Button><div><Button disabled={busy} variant="link" className="mt-2 text-xs text-muted-foreground" onClick={() => setPhoto(modelBefore)}>Use sample photo</Button></div></div>
            </div>
          )}
        </section>

        <section aria-label="Selected products" className="min-w-0">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-2xl">Your selection</h2><span className="text-xs text-muted-foreground">02</span></div>
          <div className="mb-5 flex w-full rounded-full bg-secondary p-1" role="group" aria-label="Product source">
            <Button variant="ghost" disabled={busy} aria-pressed={mode === "discover"} onClick={() => setMode("discover")} className={cn("h-auto flex-1 rounded-full px-3 py-2 text-xs", mode === "discover" && "bg-card shadow-card hover:bg-card")}>From Discover {selectedIds.length > 0 && <span>· {selectedIds.length}</span>}</Button>
            <Button variant="ghost" disabled={busy} aria-pressed={mode === "personal"} onClick={() => setMode("personal")} className={cn("h-auto flex-1 rounded-full px-3 py-2 text-xs", mode === "personal" && "bg-card shadow-card hover:bg-card")}>Upload from local</Button>
          </div>
          <div className="space-y-3">
            {selected.map((product) => <div key={product.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-card p-3 shadow-card"><img src={product.image} alt={product.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="text-[10px] uppercase text-muted-foreground">{product.brand}</p><p className="break-words font-serif text-xl leading-tight">{product.name}</p><p className="mt-1 text-xs text-gold">{product.style}</p></div><Button size="icon" variant="ghost" title={`Remove ${product.name}`} aria-label={`Remove ${product.name}`} disabled={busy} className="shrink-0 rounded-full" onClick={() => mode === "personal" ? setPersonal(null) : removeProduct(product.id)}><X /></Button></div>)}
            {selected.length === 0 && (mode === "discover" ? <div className="border-y py-8 text-center"><Sparkles className="mx-auto h-6 w-6 text-gold" /><p className="mt-3 font-serif text-xl">Something new awaits</p><Button asChild variant="link" className="mt-2"><Link to="/app">Explore Discover</Link></Button></div> : <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-secondary/50"><Button disabled={busy || !signedIn} variant="ghost" onClick={() => productInput.current?.click()}><ImagePlus />Upload product photo</Button></div>)}
          </div>
          {mode === "personal" && personal && <Button variant="outline" disabled={busy} onClick={() => productInput.current?.click()} className="mt-4 w-full rounded-full border-dashed"><Upload />Change product photo</Button>}
          {signedIn && (mode === "personal" || ["Bag", "Hat"].includes(selected[0]?.category ?? "")) && <div className="mt-4"><label id="accessory-fit-label" className="mb-2 block text-sm text-muted-foreground">Accessory fit</label><Select value={accessoryFit ?? ""} disabled={busy} onValueChange={(value) => { if (value === "female" || value === "male") setAccessoryFit(value); }}><SelectTrigger aria-labelledby="accessory-fit-label"><SelectValue placeholder="Choose fit" /></SelectTrigger><SelectContent><SelectItem value="female">Women's fit</SelectItem><SelectItem value="male">Men's fit</SelectItem></SelectContent></Select></div>}
          <Button disabled={busy || preparing || !!inputError} onClick={generate} className="mt-6 h-auto w-full whitespace-normal rounded-full px-5 py-4 shadow-soft"><Sparkles />{savingInputs ? "Saving inputs…" : photoPhase === "loading" ? "Creating your look…" : hasResult ? "Generate again" : "Generate try-on"}</Button>
          <div className="mt-7 flex items-center gap-3 border-t pt-5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-soft"><Film className="h-4 w-4 text-gold" /></div><div><p className="font-serif text-lg">Then, see it in motion</p><p className="text-xs text-muted-foreground">Photo → Video</p></div></div>
        </section>
      </div>

      {(preparing || photoPhase !== "idle") && <section ref={resultRef} aria-label="Try-on result" className="mt-12 scroll-mt-24 border-t pt-7">
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-serif text-3xl">Your new look</h2><span className="rounded-full border px-3 py-1 text-[10px] uppercase text-muted-foreground">{!signedIn ? "Sample preview" : photoPhase === "done" ? "Saved photo" : photoPhase === "failed" ? "Not completed" : "Generating"}</span></div>
        {preparing || photoPhase === "loading" ? <GenerationSkeleton kind={preparing ? "prepare" : "photo"} className="mx-auto max-w-md" /> : photoPhase === "failed" ? <div role="alert" className="border-y py-6 text-sm text-destructive">{generation.job?.error ?? "No generated image was returned. Please try again."}</div> : <>
          <div className={cn("grid items-start gap-7", !compact && "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-10")}>
            <div className="min-w-0">{compare && photo ? <CompareSlider before={photo} after={signedIn ? resultImage ?? "" : modelAfter} /> : <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted"><img src={signedIn ? resultImage ?? "" : modelAfter} alt={signedIn ? "Your generated try-on look" : "Sample generated try-on look"} className="h-full w-full object-contain" /></div>}
              <div className="mt-3 flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Like picture" title="Like picture" aria-pressed={likedPhoto} onClick={() => likeLook(photoLookId)} className={cn("rounded-full", likedPhoto && "border-gold text-gold")}><Heart className={likedPhoto ? "fill-current" : ""} /></Button><Button size="icon" variant="outline" aria-label="Download picture" title="Download picture" onClick={() => { if (!signedIn || resultImage) void downloadMedia(resultImage ?? modelAfter, "perla-try-on.jpg"); }} className="rounded-full"><Download /></Button><Button variant="outline" aria-pressed={compare} onClick={() => setCompare((value) => !value)} className="ml-auto rounded-full text-xs">{compare ? "View picture" : "Compare"}</Button></div><div className="mt-2"><ShareButton id={photoLookId} /></div>
            </div>
            <div className="min-w-0"><p className="text-xs uppercase text-gold">Photo complete <Check className="ml-1 inline h-3 w-3" /></p><h3 className="mt-2 font-serif text-3xl">A different point of view.</h3>{showFeedback(mode) && <ResultFeedback key={`photo:${mode}:${selectionKey}`} kind="photo" mode={mode} onAnswer={recordSource} />}<Button disabled={videoPhase === "loading"} onClick={startVideo} className="mt-7 h-auto w-full rounded-full py-4"><Film />{videoPhase === "loading" ? "Creating your video…" : videoPhase === "done" ? "Generate video again" : "Generate video"}</Button></div>
          </div>
        </>}
      </section>}

      {videoPhase !== "idle" && <section ref={videoRef} aria-label="Video result" className="mt-12 scroll-mt-24 border-t pt-7"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-serif text-3xl">Your look, in motion</h2>{!signedIn && <span className="rounded-full border px-3 py-1 text-[10px] uppercase text-muted-foreground">Sample preview</span>}</div>{videoPhase === "loading" ? <GenerationSkeleton kind="video" className="mx-auto max-w-md" /> : videoPhase === "failed" ? <div role="alert" className="border-y py-6 text-sm text-destructive">{realVideo.error ?? "No video was returned. Please try again."}</div> : <div className={cn("grid items-start gap-7", !compact && "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-10")}>
        <div><div className="overflow-hidden rounded-2xl bg-secondary">{videoError ? <div className="grid aspect-[3/4] place-items-center p-6 text-center"><div><p className="text-sm">Video couldn't load.</p><Button variant="outline" className="mt-3" onClick={() => setVideoError(false)}><RefreshCw />Retry video</Button></div></div> : videoSrc ? <video key={videoSrc} poster={resultImage ?? undefined} controls playsInline loop autoPlay muted preload="auto" onError={() => setVideoError(true)} className="aspect-[3/4] w-full object-contain" aria-label="Your generated try-on video" src={videoSrc} /> : <video poster={modelAfter} controls playsInline loop preload="auto" onError={() => setVideoError(true)} className="aspect-[3/4] w-full object-contain" aria-label="Generated sample try-on video"><source src={demoVideoWebm.url} type="video/webm" /><source src={demoVideo.url} type="video/mp4" /></video>}</div><div className="mt-3 flex flex-wrap gap-2"><Button size="icon" variant="outline" aria-label="Like video" title="Like video" aria-pressed={likedVideo} onClick={() => likeLook(`v${lookId}`)} className={cn("rounded-full", likedVideo && "border-gold text-gold")}><Heart className={likedVideo ? "fill-current" : ""} /></Button><Button size="icon" variant="outline" aria-label="Download video" title="Download video" onClick={() => downloadMedia(videoSrc ?? demoVideo.url, "perla-try-on.mp4")} className="rounded-full"><Download /></Button><ShareButton id={`v${lookId}`} /></div></div>
        <div><p className="text-xs uppercase text-gold">Video complete <Check className="ml-1 inline h-3 w-3" /></p><h3 className="mt-2 font-serif text-3xl">Every little movement.</h3>{showFeedback(mode) && <ResultFeedback key={`video:${mode}:${selectionKey}`} kind="video" mode={mode} />}</div>
      </div>}</section>}

      <Dialog open={photoDialog} onOpenChange={setPhotoDialog}><DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-7"><div className="grid h-12 w-12 place-items-center rounded-full bg-gold-soft"><ImagePlus className="h-6 w-6 text-gold" /></div><DialogTitle className="font-serif text-3xl font-normal">Let's see it on you</DialogTitle><DialogDescription>Add your photo to try on your selection.</DialogDescription>{inputError && <p role="alert" className="text-sm text-destructive">{inputError}</p>}<Button disabled={busy || !signedIn} onClick={() => photoInput.current?.click()} className="h-auto rounded-full py-3">{savingInputs ? <LoaderCircle className="motion-safe:animate-spin" /> : <Upload />}{savingInputs ? "Saving photo…" : "Upload your photo"}</Button><Button disabled={busy} variant="outline" onClick={() => { setPhoto(modelBefore); setPhotoDialog(false); }} className="rounded-full">Use sample photo</Button></DialogContent></Dialog>
    </div>
  );
}