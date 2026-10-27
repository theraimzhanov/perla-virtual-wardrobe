import type React from "react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { discoverProducts, type DiscoverProduct } from "./data";
import { listProducts } from "./products.functions";
import { seedLooks, toggleLike, type Look, type LookSource } from "./looks";
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
  const addLook = (look: Omit<Look, "likes" | "liked" | "shared" | "mine" | "author">) => {
    setLooks((all) => all.some((item) => item.id === look.id) ? all : [{ ...look, likes: 0, liked: false, shared: false, mine: true, author: "You" }, ...all]);
  };
  const likeLook = (id: string) => setLooks((all) => all.map((look) => look.id === id ? toggleLike(look) : look));
  const shareLook = (id: string) => setLooks((all) => all.map((look) => look.id === id ? { ...look, shared: true } : look));
  const unshareLook = (id: string) => setLooks((all) => all.map((look) => look.id === id ? { ...look, shared: false } : look));
  const deleteLook = (id: string) => setLooks((all) => all.filter((look) => look.id !== id));
  const [triedIds, setTriedIds] = useState<string[]>(discoverProducts.slice(0, 2).map((p) => p.id));
  const markTried = (ids: string[]) => setTriedIds((all) => [...new Set([...ids, ...all])]);
  const removeTried = (id: string) => setTriedIds((all) => all.filter((item) => item !== id));
  const triedProducts = triedIds.map((id) => catalog.find((p) => p.id === id)).filter((p): p is DiscoverProduct => !!p);
  const updateLookSource = (ids: string[], source: LookSource) => setLooks((all) => all.map((look) => ids.includes(look.id) ? { ...look, source } : look));

  return { ...savedInputs, selectProduct, preparing, setPreparing, looks, addLook, likeLook, shareLook, updateLookSource, unshareLook, deleteLook, triedProducts, markTried, removeTried, catalog, query, setQuery };
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