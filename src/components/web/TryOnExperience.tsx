import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Download, Trash2, Heart, ImagePlus, LoaderCircle, RefreshCw, Send, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CompareSlider } from "@/components/perla/CompareSlider";
import { modelBefore, modelAfter } from "@/components/perla/data";
import { useTryOn } from "./TryOnContext";
import { GenerationSkeleton } from "./GenerationSkeleton";
import { ResultFeedback } from "./ResultFeedback";
import { generationIssue, lookSource, showFeedback } from "./try-on-rules";
import { sourceFromFeedback, type LookSource } from "./looks";
import { cn } from "@/lib/utils";
import { validateImage } from "./upload-rules";
import { usePhotoGeneration } from "./usePhotoGeneration";
import { SamplePhotoPicker } from "./SamplePhotoPicker";

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
  const { userId, selectedInputProductId, photo, photoId, setPhoto, uploadPhoto, uploadProduct, selected, selectedIds, mode, setMode, personal, setPersonal, removeProduct, preparing, setPreparing, addLook, shareLook, looks, likeLook, updateLookSource, markTried, savingInputs, inputError, retryInputs, signedIn, photoJobs, deleteJob, patchJob, refreshPhotoJobs, generationHistoryError } = useTryOn();
  const [deleting, setDeleting] = useState<"photo" | null>(null);
  const [lookId, setLookId] = useState(0);
  const [demoPhotoPhase, setDemoPhotoPhase] = useState<Phase>("idle");
  const [photoDialog, setPhotoDialog] = useState(false);
  const [sampleDialog, setSampleDialog] = useState(false);
  const [productSource, setProductSource] = useState<LookSource>(lookSource(mode));
  const [compare, setCompare] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const productInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const selectionKey = selected.map((item) => `${item.id}:${item.image}`).join("|");
  // The newest saved try-on stays here until it is deleted or replaced by a new one.
  const restored = signedIn ? photoJobs[0] : undefined;
  const generation = usePhotoGeneration(userId, `${photoId}:${selectedInputProductId}:${mode}`, restored);
  const photoPhase = signedIn ? generation.phase : demoPhotoPhase;
  const resultImage = generation.job?.image ?? null;
  const photoLookId = generation.job ? `job:${generation.job.id}` : `p${lookId}`;
  const likedPhoto = looks.some((look) => look.id === photoLookId && look.liked);
  const feedbackMode = signedIn && generation.job ? (generation.job.source === "discover" ? "discover" : "personal") : mode;
  const removePhoto = async () => {
    if (deleting) return;
    if (!signedIn || !generation.job) { setDemoPhotoPhase("idle"); setCompare(false); return; }
    setDeleting("photo");
    const ok = await deleteJob(generation.job.id);
    setDeleting(null);
    if (ok) { generation.clear(); setCompare(false); toast("Try-on deleted"); }
  };
  // Stop removes the unfinished job; a request already sent to Perfect Corp can't be recalled, so its result is discarded.
  const stopPhoto = async () => {
    if (deleting || !generation.job) return;
    setDeleting("photo");
    const ok = await deleteJob(generation.job.id);
    setDeleting(null);
    if (ok) { generation.clear(); setCompare(false); toast("Generation stopped"); }
    else toast.error("Couldn't stop it. Please try again.");
  };

  useEffect(() => {
    setDemoPhotoPhase("idle");
    setProductSource(lookSource(mode));
    setCompare(false);
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
    if (photoPhase === "loading") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [photoPhase]);

  const acceptFile = async (event: ChangeEvent<HTMLInputElement>, kind: "photo" | "product") => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    try { validateImage(file); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Choose a valid image."); return; }
    const saved = await (kind === "photo" ? uploadPhoto(file) : uploadProduct(file));
    if (saved && kind === "photo") setPhotoDialog(false);
  };

  const useSample = async (image: string, id: string) => {
    if (!signedIn) { await setPhoto(image); setPhotoDialog(false); return true; }
    try {
      const response = await fetch(image);
      if (!response.ok) throw new Error("Couldn't open this sample photo.");
      const blob = await response.blob();
      const saved = await uploadPhoto(new File([blob], `perla-sample-${id}.jpg`, { type: "image/jpeg" }));
      if (saved) setPhotoDialog(false);
      return saved;
    } catch { toast.error("Couldn't save the sample photo. Please try again."); return false; }
  };

  const generate = () => {
    if (savingInputs || inputError) return;
    const issue = generationIssue(photo, selected);
    if (issue === "photo") { setPhotoDialog(true); return; }
    if (issue === "product") { toast.error("Select a product in Discover or upload your own."); return; }
    setPreparing(false);
    setLookId(Date.now());
    if (!signedIn) { setDemoPhotoPhase("loading"); return; }
    void generation.start();
  };

  const lookTitle = selected[0]?.name ?? "New look";
  useEffect(() => {
    if (photoPhase !== "done") return;
    if (mode === "discover") markTried(selectedIds);
    if (signedIn) { if (resultImage && generation.job) void refreshPhotoJobs(); }
    else addLook({ id: `p${lookId}`, title: lookTitle, product: lookTitle, kind: "photo", image: modelAfter, source: productSource });
  }, [photoPhase, resultImage]); // eslint-disable-line react-hooks/exhaustive-deps
  const recordSource = (question: string, answer: string) => {
    if (mode !== "personal" || question !== "where") return;
    const source = sourceFromFeedback(answer);
    if (!source) return;
    setProductSource(source);
    updateLookSource([photoLookId], source);
  };
  const isShared = (id: string) => looks.some((look) => look.id === id && look.shared);
  const ShareButton = ({ id }: { id: string }) => <Button variant="outline" disabled={isShared(id)} onClick={() => shareLook(id)} className="rounded-full text-xs"><Send />{isShared(id) ? "Shared" : "Share to Brand Insights"}</Button>;
  const busy = savingInputs || photoPhase === "loading" || deleting !== null;
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
              <div><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-card"><ImagePlus className="h-7 w-7 text-gold" /></div><h3 className="mt-5 font-serif text-3xl">Start with you</h3><p className="mt-2 text-sm text-muted-foreground">Your full-body photo</p><Button disabled={busy || !signedIn} onClick={() => photoInput.current?.click()} className="mt-5 rounded-full"><Upload />Upload photo</Button></div>
            </div>
          )}
           <Button variant="outline" disabled={busy} onClick={() => setSampleDialog(true)} className="mt-5 w-full rounded-full border-dashed"><Sparkles />Use a sample model</Button>
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
          <Button disabled={busy || preparing || !!inputError} onClick={generate} className="mt-6 h-auto w-full whitespace-normal rounded-full px-5 py-4 shadow-soft"><Sparkles />{savingInputs ? "Saving inputs…" : photoPhase === "loading" ? "Creating your look…" : hasResult ? "Generate again" : "Generate try-on"}</Button>
        </section>
      </div>

      {(preparing || (photoPhase !== "idle" && (photoPhase !== "failed" || generation.error))) && <section ref={resultRef} aria-label="Try-on result" className="mt-12 scroll-mt-24 border-t pt-7">
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-serif text-3xl">Your new look</h2><span className="rounded-full border px-3 py-1 text-[10px] uppercase text-muted-foreground">{!signedIn ? "Sample preview" : photoPhase === "done" ? "Saved photo" : photoPhase === "failed" ? "Not completed" : "Generating"}</span></div>
        {preparing || photoPhase === "loading" ? <div className="mx-auto max-w-md"><GenerationSkeleton kind={preparing ? "prepare" : "photo"} />{signedIn && generation.job && photoPhase === "loading" && <Button variant="outline" disabled={deleting !== null} onClick={() => { void stopPhoto(); }} className="mt-4 w-full rounded-full"><X />{deleting === "photo" ? "Stopping…" : "Stop generating"}</Button>}</div> : photoPhase === "failed" ? <div role="alert" className="border-y py-6 text-sm text-destructive">{generation.error}</div> : <>
          <div className={cn("grid items-start gap-7", !compact && "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-10")}>
            <div className="min-w-0">{compare && photo ? <CompareSlider before={photo} after={signedIn ? resultImage ?? "" : modelAfter} /> : <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted"><img src={signedIn ? resultImage ?? "" : modelAfter} alt={signedIn ? "Your generated try-on look" : "Sample generated try-on look"} className="h-full w-full object-contain" /></div>}
              <div className="mt-3 flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Like picture" title="Like picture" aria-pressed={likedPhoto} onClick={() => likeLook(photoLookId)} className={cn("rounded-full", likedPhoto && "border-gold text-gold")}><Heart className={likedPhoto ? "fill-current" : ""} /></Button><Button size="icon" variant="outline" aria-label="Download picture" title="Download picture" onClick={() => { if (!signedIn || resultImage) void downloadMedia(resultImage ?? modelAfter, "perla-try-on.jpg"); }} className="rounded-full"><Download /></Button><Button size="icon" variant="outline" aria-label="Delete picture" title="Delete picture" disabled={deleting !== null} onClick={() => { void removePhoto(); }} className="rounded-full text-destructive">{deleting === "photo" ? <LoaderCircle className="motion-safe:animate-spin" /> : <Trash2 />}</Button><Button variant="outline" aria-pressed={compare} onClick={() => setCompare((value) => !value)} className="ml-auto rounded-full text-xs">{compare ? "View picture" : "Compare"}</Button></div><div className="mt-2"><ShareButton id={photoLookId} /></div>
            </div>
            <div className="min-w-0"><p className="text-xs uppercase text-gold">Photo complete <Check className="ml-1 inline h-3 w-3" /></p><h3 className="mt-2 font-serif text-3xl">A different point of view.</h3>{showFeedback(feedbackMode) && <ResultFeedback key={`photo:${generation.job?.id ?? `${mode}:${selectionKey}:${lookId}`}`} kind="photo" mode={feedbackMode} jobId={signedIn ? generation.job?.id : undefined} alreadySent={signedIn && Boolean(generation.job?.feedbackSent)} onSent={() => { if (generation.job) patchJob(generation.job.id, { feedbackSent: true }); }} onAnswer={recordSource} />}</div>
          </div>
        </>}
      </section>}


      <Dialog open={photoDialog} onOpenChange={setPhotoDialog}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl p-7"><div className="grid h-12 w-12 place-items-center rounded-full bg-gold-soft"><ImagePlus className="h-6 w-6 text-gold" /></div><DialogTitle className="font-serif text-3xl font-normal">Let's see it on you</DialogTitle><DialogDescription>Add your photo to try on your selection.</DialogDescription>{inputError && <p role="alert" className="text-sm text-destructive">{inputError}</p>}<Button disabled={busy || !signedIn} onClick={() => photoInput.current?.click()} className="h-auto rounded-full py-3">{savingInputs ? <LoaderCircle className="motion-safe:animate-spin" /> : <Upload />}{savingInputs ? "Saving photo…" : "Upload your photo"}</Button><SamplePhotoPicker disabled={busy} onSelect={useSample} /></DialogContent></Dialog>

      <Dialog open={sampleDialog} onOpenChange={setSampleDialog}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl p-7"><DialogTitle className="font-serif text-3xl font-normal">Choose a sample model</DialogTitle><DialogDescription>Three women · three men — pick one to start your try-on.</DialogDescription><SamplePhotoPicker disabled={busy} onSelect={async (image, id) => { const ok = await useSample(image, id); if (ok) setSampleDialog(false); return ok; }} /></DialogContent></Dialog>
    </div>
  );
}