import type React from "react";
import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { changeGeneratedLook, listPhotoJobs } from "./generation.functions";
import { photoJobPhase, type PhotoJob } from "./generation-rules";
import { discoverProducts, type DiscoverProduct } from "./data";
import { listProducts } from "./products.functions";
import { seedLooks, type Look, type LookSource } from "./looks";
import { useSavedTryOnInputs } from "./useSavedTryOnInputs";

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

  const [looks, setLooks] = useState<Look[]>(seedLooks);
  const [photoJobs, setPhotoJobs] = useState<PhotoJob[]>([]);
  const [generationHistoryError, setGenerationHistoryError] = useState<string | null>(null);
  const loadJobs = useServerFn(listPhotoJobs);
  const changeSavedLook = useServerFn(changeGeneratedLook);
  const owner = useRef(userId);
  owner.current = userId;
  const refreshPhotoJobs = useCallback(async () => {
    if (!userId) return;
    try {
      const rows = await loadJobs();
      if (owner.current !== userId) return;
      setPhotoJobs(rows); setGenerationHistoryError(null);
      const real = rows.filter((job) => photoJobPhase(job) === "done" && job.image).map((job): Look => ({ id: `job:${job.id}`, jobId: job.id, title: job.title, product: job.title, author: "You", kind: "photo", image: job.image ?? "", source: job.source, likes: job.liked ? 1 : 0, liked: job.liked, shared: job.shared, mine: true }));
      setLooks((all) => [...real, ...all.filter((look) => !look.jobId)]);
    } catch { if (owner.current === userId) setGenerationHistoryError("Couldn't load your saved looks. Please retry."); }
  }, [userId, loadJobs]);
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
    if (!photoJobs.some((job) => ["pending", "processing"].includes(job.status))) return;
    const timer = setInterval(() => { void refreshPhotoJobs(); }, 10000);
    return () => clearInterval(timer);
  }, [photoJobs, refreshPhotoJobs]);
  const addLook = (look: Omit<Look, "likes" | "liked" | "shared" | "mine" | "author">) => {
    setLooks((all) => all.some((item) => item.id === look.id) ? all : [{ ...look, likes: 0, liked: false, shared: false, mine: true, author: "You" }, ...all]);
  };
  const changeLook = async (id: string, changes: { liked?: boolean; shared?: boolean; deleted?: true; source?: "own" | "internet" | "store" }) => {
    const look = looks.find((item) => item.id === id);
    if (!look) return;
    const expectedOwner = userId;
    if (look.jobId) {
      try { await changeSavedLook({ data: { id: look.jobId, ...changes } }); }
      catch { toast.error("Couldn't save that change. Please retry."); return; }
      if (owner.current !== expectedOwner) return;
    }
    setLooks((all) => changes.deleted ? all.filter((item) => item.id !== id) : all.map((item) => item.id === id ? { ...item, ...changes, ...(changes.liked !== undefined ? { likes: Math.max(0, item.likes + (changes.liked ? 1 : -1)) } : {}) } : item));
    if (look.jobId) void refreshPhotoJobs();
  };
  const likeLook = (id: string) => { const look = looks.find((item) => item.id === id); if (look) void changeLook(id, { liked: !look.liked }); };
  const shareLook = (id: string) => { void changeLook(id, { shared: true }); };
  const unshareLook = (id: string) => { void changeLook(id, { shared: false }); };
  const deleteLook = (id: string) => { void changeLook(id, { deleted: true }); };
  const [triedIds, setTriedIds] = useState<string[]>(discoverProducts.slice(0, 2).map((p) => p.id));
  const markTried = (ids: string[]) => setTriedIds((all) => [...new Set([...ids, ...all])]);
  const removeTried = (id: string) => setTriedIds((all) => all.filter((item) => item !== id));
  const triedProducts = triedIds.map((id) => catalog.find((p) => p.id === id)).filter((p): p is DiscoverProduct => !!p);
  const updateLookSource = (ids: string[], source: LookSource) => { if (source !== "discover") for (const id of ids) void changeLook(id, { source }); };

  return { ...savedInputs, selectProduct, preparing, setPreparing, looks, addLook, likeLook, shareLook, updateLookSource, unshareLook, deleteLook, triedProducts, markTried, removeTried, catalog, query, setQuery, photoJobs, refreshPhotoJobs, generationHistoryError };
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