import type React from "react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { discoverProducts, type DiscoverProduct } from "./data";
import { addSelection, type ProductMode } from "./try-on-rules";
import { seedLooks, toggleLike, type Look, type LookSource } from "./looks";

function useTryOnState() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [personal, setPersonal] = useState<DiscoverProduct | null>(null);
  const [mode, setMode] = useState<ProductMode>("discover");
  const [preparing, setPreparing] = useState(false);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const fileUrl = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    return url;
  };
  const selectProduct = (id: string) => {
    setSelectedIds((ids) => addSelection(ids, id));
    setMode("discover");
    setPreparing(true);
  };
  const uploadPhoto = (file: File) => setPhoto(fileUrl(file));
  const uploadProduct = (file: File) => {
    setPersonal({ id: "personal", name: file.name.replace(/\.[^.]+$/, ""), brand: "Your product", style: "Personal selection", category: "Clothes", image: fileUrl(file), source: "personal" });
    setMode("personal");
  };
  const selected = mode === "personal"
    ? personal ? [personal] : []
    : discoverProducts.filter((product) => selectedIds.includes(product.id));

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
  const triedProducts = triedIds.map((id) => discoverProducts.find((p) => p.id === id)).filter((p): p is DiscoverProduct => !!p);
  const updateLookSource = (ids: string[], source: LookSource) => setLooks((all) => all.map((look) => ids.includes(look.id) ? { ...look, source } : look));

  return { photo, setPhoto, uploadPhoto, uploadProduct, personal, setPersonal, selectedIds, selectProduct, selected, mode, setMode, preparing, setPreparing, removeProduct: (id: string) => setSelectedIds((ids) => ids.filter((item) => item !== id)), looks, addLook, likeLook, shareLook, updateLookSource, unshareLook, deleteLook, triedProducts, markTried, removeTried };
}

type TryOnState = ReturnType<typeof useTryOnState>;
const globalKey = "__perlaTryOnContext" as const;
const store = globalThis as unknown as Record<typeof globalKey, React.Context<TryOnState | null> | undefined>;
// Reuse one context across hot reloads so the provider and consumers never get out of sync.
const TryOnContext = (store[globalKey] ??= createContext<TryOnState | null>(null));

export function TryOnProvider({ children }: { children: ReactNode }) {
  const state = useTryOnState();
  return <TryOnContext.Provider value={state}>{children}</TryOnContext.Provider>;
}

export function useTryOn() {
  const context = useContext(TryOnContext);
  if (!context) throw new Error("Try-On must be rendered within TryOnProvider");
  return context;
}