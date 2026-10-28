import type React from "react";
import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { changeGeneratedLook, listPhotoJobs } from "./generation.functions";
import { hideWardrobePiece, listCommunityLooks, listWardrobe, setLookLike, type CommunityLook, type WardrobePiece } from "./looks.functions";
import { photoJobPhase, type PhotoJob } from "./generation-rules";
import { discoverProducts, type DiscoverProduct } from "./data";
import { listProducts } from "./products.functions";
import { type Look, type LookSource } from "./looks";
import { useSavedTryOnInputs } from "./useSavedTryOnInputs";

export const jobLook = (job: PhotoJob): Look => ({ id: `job:${job.id}`, jobId: job.id, title: job.studioScene ? `${job.studioScene} · ${job.title}` : job.title, product: job.title, brand: job.brand ?? undefined, author: "You", kind: job.kind, image: job.image ?? "", ...(job.kind === "video" && job.video ? { video: { mp4: job.video } } : {}), source: job.source, likes: job.likes ?? 0, liked: job.liked, shared: job.shared, mine: true });
const communityLook = (look: CommunityLook): Look => ({ id: `job:${look.jobId}`, jobId: look.jobId, title: look.product, product: look.product, brand: look.brand ?? undefined, author: look.author, kind: look.kind, image: look.image, ...(look.video ? { video: { mp4: look.video } } : {}), source: look.source, likes: look.likes, liked: look.liked, shared: true, mine: look.mine });

function useTryOnState(userId: string | null, authReady: boolean) {
  const savedInputs = useSavedTryOnInputs(userId, authReady);
  const [preparing, setPreparing] = useState(false);
  const [catalog, setCatalog] = useState<DiscoverProduct[]>(discoverProducts);
  const [query, setQuery] = useState("");
  useEffect(() => {
    let alive = true;
    listProducts()
      .then((rows) => { if (alive && rows.length > 0) setCatalog(rows); })
      .catch(() => { /* keep bundled fallback catalog */ });
    return () => { alive = false; };
  }, []);

  const selectProduct = async (id: string) => {
    setPreparing(true);
    await savedInputs.selectProduct(id);
  };

  const [jobs, setJobs] = useState<PhotoJob[]>([]);
  const [community, setCommunity] = useState<CommunityLook[]>([]);
  const [localLooks, setLocalLooks] = useState<Look[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobePiece[]>([]);
  const [generationHistoryError, setGenerationHistoryError] = useState<string | null>(null);
  const loadJobs = useServerFn(listPhotoJobs);
  const loadCommunity = useServerFn(listCommunityLooks);
  const loadWardrobe = useServerFn(listWardrobe);
  const changeSavedLook = useServerFn(changeGeneratedLook);
  const likeSaved = useServerFn(setLookLike);
  const hidePiece = useServerFn(hideWardrobePiece);
  const owner = useRef(userId);
  owner.current = userId;
  // Ids with a change in flight: repeated fast clicks are ignored until the first save returns.
  const pending = useRef(new Set<string>());

  const refreshPhotoJobs = useCallback(async () => {
    if (!userId) return;
    try {
      const [rows, shared, pieces] = await Promise.all([loadJobs(), loadCommunity().catch(() => null), loadWardrobe().catch(() => null)]);
      if (owner.current !== userId) return;
      setJobs(rows); setGenerationHistoryError(null);
      if (shared) setCommunity(shared);
      if (pieces) setWardrobe(pieces);
    } catch { if (owner.current === userId) setGenerationHistoryError("Couldn't load your saved looks. Please retry."); }
  }, [userId, loadJobs, loadCommunity, loadWardrobe]);
  useEffect(() => {
    if (!userId || !authReady) return;
    let alive = true;
    let checking = false;
    const refresh = async () => { if (!alive || checking) return; checking = true; await refreshPhotoJobs(); checking = false; };
    const channel = supabase.channel(`saved-looks-${userId}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "generation_jobs", filter: `user_id=eq.${userId}` }, () => { void refresh(); })
      .subscribe((status) => { if (status === "SUBSCRIBED") void refresh(); });
    void refresh();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [userId, authReady, refreshPhotoJobs]);
  useEffect(() => {
    if (!jobs.some((job) => ["pending", "processing"].includes(job.status))) return;
    const timer = setInterval(() => { void refreshPhotoJobs(); }, 10000);
    return () => clearInterval(timer);
  }, [jobs, refreshPhotoJobs]);

  // AI Studio creations live in Profile and Studio, never in the Try-On result slots.
  const photoJobs = jobs.filter((job) => job.kind === "photo" && !job.studioScene);
  const videoJobs = jobs.filter((job) => job.kind === "video" && !job.studioScene);
  const studioJobs = jobs.filter((job) => Boolean(job.studioScene));
  const mineLooks = jobs.filter((job) => photoJobPhase(job) === "done").map(jobLook);
  const looks: Look[] = [...mineLooks, ...community.filter((item) => !jobs.some((job) => job.id === item.jobId)).map(communityLook), ...localLooks];

  const addLook = (look: Omit<Look, "likes" | "liked" | "shared" | "mine" | "author">) => {
    setLocalLooks((all) => all.some((item) => item.id === look.id) ? all : [{ ...look, likes: 0, liked: false, shared: false, mine: true, author: "You" }, ...all]);
  };
  const patchJob = (jobId: string, changes: Partial<PhotoJob>) => {
    setJobs((all) => all.map((job) => job.id === jobId ? { ...job, ...changes } : job));
    setCommunity((all) => all.map((item) => item.jobId === jobId ? { ...item, ...(changes.likes !== undefined ? { likes: changes.likes } : {}), ...(changes.liked !== undefined ? { liked: changes.liked } : {}) } : item));
  };
  const guard = async (key: string, run: () => Promise<void>) => {
    if (pending.current.has(key)) return false;
    pending.current.add(key);
    try { await run(); return true; } finally { pending.current.delete(key); }
  };

  const changeLook = async (id: string, changes: { shared?: boolean; deleted?: true; source?: "own" | "internet" | "store" }) => {
    const look = looks.find((item) => item.id === id);
    if (!look) return false;
    if (!look.jobId) {
      setLocalLooks((all) => changes.deleted ? all.filter((item) => item.id !== id) : all.map((item) => item.id === id ? { ...item, ...changes } : item));
      return true;
    }
    const jobId = look.jobId;
    const expectedOwner = userId;
    return guard(`change:${jobId}`, async () => {
      try { await changeSavedLook({ data: { id: jobId, ...changes } }); }
      catch (cause) { toast.error(cause instanceof Error ? cause.message : "Couldn't save that change. Please retry."); throw cause; }
      if (owner.current !== expectedOwner) return;
      if (changes.deleted) { setJobs((all) => all.filter((job) => job.id !== jobId && job.parentJobId !== jobId)); setCommunity((all) => all.filter((item) => item.jobId !== jobId)); }
      else patchJob(jobId, changes);
      void refreshPhotoJobs();
    }).catch(() => false);
  };
  const deleteJob = (jobId: string) => changeLook(`job:${jobId}`, { deleted: true });
  const likeLook = (id: string) => {
    const look = looks.find((item) => item.id === id);
    if (!look) return;
    if (!look.jobId) { setLocalLooks((all) => all.map((item) => item.id === id ? { ...item, liked: !item.liked, likes: Math.max(0, item.likes + (item.liked ? -1 : 1)) } : item)); return; }
    const jobId = look.jobId;
    const liked = !look.liked;
    void guard(`like:${jobId}`, async () => {
      patchJob(jobId, { liked, likes: Math.max(0, look.likes + (liked ? 1 : -1)) });
      try { const saved = await likeSaved({ data: { jobId, liked } }); patchJob(jobId, saved); }
      catch { patchJob(jobId, { liked: look.liked, likes: look.likes }); toast.error("Couldn't save your like. Please retry."); }
    });
  };
  const shareLook = (id: string) => { void changeLook(id, { shared: true }).then((ok) => { if (ok) toast.success("Shared to Brand Insights"); }); };
  const unshareLook = (id: string) => { void changeLook(id, { shared: false }).then((ok) => { if (ok) toast("Removed from Brand Insights"); }); };
  const deleteLook = (id: string) => { void changeLook(id, { deleted: true }).then((ok) => { if (ok) toast("Look deleted"); }); };
  const updateLookSource = (ids: string[], source: LookSource) => { if (source !== "discover") for (const id of ids) void changeLook(id, { source }); };

  // Signed-out demo keeps a local wardrobe; signed-in members read theirs from saved try-ons.
  const [triedIds, setTriedIds] = useState<string[]>([]);
  const markTried = (ids: string[]) => { if (!userId) setTriedIds((all) => [...new Set([...ids, ...all])]); };
  const removeTried = (id: string) => {
    if (!userId) { setTriedIds((all) => all.filter((item) => item !== id)); return; }
    void guard(`wardrobe:${id}`, async () => {
      const before = wardrobe;
      setWardrobe((all) => all.filter((piece) => piece.id !== id));
      try { await hidePiece({ data: { id } }); } catch { setWardrobe(before); toast.error("Couldn't update your wardrobe."); }
    });
  };
  const triedProducts: WardrobePiece[] = userId ? wardrobe : triedIds.map((id) => catalog.find((p) => p.id === id)).filter((p): p is DiscoverProduct => !!p).map((p) => ({ id: p.id, name: p.name, brand: p.brand, image: p.image }));

  return { ...savedInputs, userId, selectProduct, preparing, setPreparing, looks, addLook, likeLook, shareLook, updateLookSource, unshareLook, deleteLook, deleteJob, triedProducts, markTried, removeTried, catalog, query, setQuery, photoJobs, videoJobs, studioJobs, refreshPhotoJobs, generationHistoryError, patchJob };
}

type TryOnState = ReturnType<typeof useTryOnState>;
const globalKey = "__perlaTryOnContext" as const;
const store = globalThis as unknown as Record<typeof globalKey, React.Context<TryOnState | null> | undefined>;
// Reuse one context across hot reloads so the provider and consumers never get out of sync.
const TryOnContext = (store[globalKey] ??= createContext<TryOnState | null>(null));

export function TryOnProvider({ children, userId = null, authReady = false }: { children: ReactNode; userId?: string | null; authReady?: boolean }) {
  const state = useTryOnState(userId, authReady);
  return <TryOnContext.Provider value={state}>{children}</TryOnContext.Provider>;
}

export function useTryOn() {
  const context = useContext(TryOnContext);
  if (!context) throw new Error("Try-On must be rendered within TryOnProvider");
  return context;
}
