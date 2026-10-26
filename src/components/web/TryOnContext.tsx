import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { discoverProducts, type DiscoverProduct } from "./data";
import { addSelection, type ProductMode } from "./try-on-rules";

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

  return { photo, setPhoto, uploadPhoto, uploadProduct, personal, setPersonal, selectedIds, selectProduct, selected, mode, setMode, preparing, setPreparing, removeProduct: (id: string) => setSelectedIds((ids) => ids.filter((item) => item !== id)) };
}

type TryOnState = ReturnType<typeof useTryOnState>;
const TryOnContext = createContext<TryOnState | null>(null);

export function TryOnProvider({ children }: { children: ReactNode }) {
  const state = useTryOnState();
  return <TryOnContext.Provider value={state}>{children}</TryOnContext.Provider>;
}

export function useTryOn() {
  const context = useContext(TryOnContext);
  if (!context) throw new Error("Try-On must be rendered within TryOnProvider");
  return context;
}