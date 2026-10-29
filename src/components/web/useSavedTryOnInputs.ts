import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { discoverCategories, type DiscoverProduct } from "./data";
import { emptyInputSelection, exclusiveSelection, personalUpload, saveUploadedInput, uploadBucket, uploadMetadataSchema, uploadPath, validateImage, type InputSelection } from "./upload-rules";
import { getSavedInputs, registerUploadedInput, saveDiscoverInput, saveInputSelection } from "./uploads.functions";

type LocalInputs = {
  selection: InputSelection;
  photo: string | null;
  personal: DiscoverProduct | null;
  products: Tables<"try_on_products">[];
};
const emptyInputs = (): LocalInputs => ({ selection: emptyInputSelection(), photo: null, personal: null, products: [] });

export function useSavedTryOnInputs(userId: string | null, authReady: boolean) {
  const loadInputs = useServerFn(getSavedInputs);
  const registerUpload = useServerFn(registerUploadedInput);
  const registerDiscover = useServerFn(saveDiscoverInput);
  const saveSelection = useServerFn(saveInputSelection);
  const [inputs, setInputs] = useState<LocalInputs>(emptyInputs);
  const current = useRef(inputs);
  const owner = useRef(userId);
  owner.current = userId;
  const epoch = useRef(0);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const retryAction = useRef<(() => void) | null>(null);
  const commit = (value: LocalInputs) => { current.current = value; setInputs(value); };

  const signedImage = async (path: string) => {
    const { data, error } = await supabase.storage.from(uploadBucket).createSignedUrl(path, 86400);
    if (error || !data?.signedUrl) throw new Error("Couldn't open your saved image. Please retry.");
    return data.signedUrl;
  };

  const restore = async (expectedOwner: string, version: number) => {
    setRestoring(true);
    setError(null);
    try {
      const saved = await loadInputs();
      const selection = exclusiveSelection(saved.selection);
      const personalRow = saved.products.find((product) => product.id === selection.personalProductId);
      const [photo, personalImage] = await Promise.all([
        saved.photo ? signedImage(saved.photo.storage_path) : Promise.resolve(null),
        personalRow?.storage_path ? signedImage(personalRow.storage_path) : Promise.resolve(null),
      ]);
      if (owner.current !== expectedOwner || epoch.current !== version) return;
      commit({ selection, photo, products: saved.products, personal: personalRow && personalImage ? personalUpload(personalRow.id, personalRow.original_filename ?? personalRow.name, personalImage) : null });
      loaded.current = true;
      retryAction.current = null;
    } catch (cause) {
      if (owner.current !== expectedOwner || epoch.current !== version) return;
      setError(cause instanceof Error ? cause.message : "Couldn't load your photos. Please retry.");
      retryAction.current = () => { queue.current = restore(expectedOwner, version); };
    } finally {
      if (owner.current === expectedOwner && epoch.current === version) setRestoring(false);
    }
  };

  useEffect(() => {
    const version = ++epoch.current;
    loaded.current = false;
    commit(emptyInputs());
    setSaving(false);
    setError(null);
    retryAction.current = null;
    if (!authReady) { setRestoring(true); return; }
    if (!userId) { setRestoring(false); queue.current = Promise.resolve(); return; }
    queue.current = restore(userId, version);
    return () => { epoch.current++; };
  }, [userId, authReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Renew temporary access links without changing the saved selection.
  useEffect(() => {
    if (!userId) return;
    const timer = setInterval(() => {
      if (saving || restoring || !loaded.current) return;
      queue.current = queue.current.then(() => restore(userId, epoch.current));
    }, 12 * 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, [userId, saving, restoring]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (operation: (expectedOwner: string, isCurrent: () => boolean) => Promise<void>) => {
    const expectedOwner = owner.current;
    const version = epoch.current;
    if (!expectedOwner) { setError("Sign in to save your photos and selections."); return Promise.resolve(false); }
    const isCurrent = () => owner.current === expectedOwner && epoch.current === version;
    setSaving(true);
    setError(null);
    const task = queue.current.then(async () => {
      if (!isCurrent()) return false;
      if (!loaded.current) throw new Error("Your saved selection hasn't loaded. Please retry loading first.");
      await operation(expectedOwner, isCurrent);
      return isCurrent();
    }).catch((cause: unknown) => {
      if (isCurrent()) {
        setError(cause instanceof Error ? cause.message : "Couldn't save your photo. Please retry.");
        if (loaded.current) retryAction.current = () => { void run(operation); };
      }
      return false;
    });
    queue.current = task;
    void task.then(() => { if (isCurrent() && queue.current === task) setSaving(false); });
    return task;
  };

  const persist = async (next: LocalInputs, expectedOwner: string, isCurrent: () => boolean) => {
    if (!isCurrent()) return;
    await saveSelection({ data: { ...next.selection, expectedOwner } });
    if (isCurrent()) { commit(next); retryAction.current = null; }
  };

  const upload = (file: File, kind: "photo" | "product") => run(async (expectedOwner, isCurrent) => {
    validateImage(file);
    const id = crypto.randomUUID();
    const path = uploadPath(expectedOwner, id, kind, file.type);
    await saveUploadedInput({
      upload: async () => {
        if (!isCurrent()) throw new Error("Your account changed. Please try again.");
        const { error } = await supabase.storage.from(uploadBucket).upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error("Couldn't upload your image. Please check your connection and retry.");
      },
      save: async () => {
        if (!isCurrent()) throw new Error("Your account changed. Please try again.");
        return registerUpload({ data: uploadMetadataSchema.parse({ id, kind, storagePath: path, filename: file.name, mimeType: file.type, fileSize: file.size }) });
      },
      cleanup: async () => { if (isCurrent()) await supabase.storage.from(uploadBucket).remove([path]); },
    });
    if (!isCurrent()) return;
    const image = await signedImage(path);
    if (!isCurrent()) return;
    const next = kind === "photo"
      ? { ...current.current, photo: image, selection: { ...current.current.selection, photoId: id } }
      : { ...current.current, personal: personalUpload(id, file.name, image), selection: exclusiveSelection({ ...current.current.selection, personalProductId: id, mode: "personal" }) };
    await persist(next, expectedOwner, isCurrent);
  });

  const selectProduct = (catalogId: string) => run(async (expectedOwner, isCurrent) => {
    const product = await registerDiscover({ data: { catalogId, expectedOwner } });
    if (!isCurrent()) return;
    const previous = current.current;
    const next = { ...previous, personal: null, products: previous.products.some((item) => item.id === product.id) ? previous.products : [...previous.products, product], selection: exclusiveSelection({ ...previous.selection, mode: "discover", selectedProductIds: [product.id] }) };
    await persist(next, expectedOwner, isCurrent);
  });
  const setMode = (mode: InputSelection["mode"]) => {
    if (!userId) { commit({ ...current.current, selection: { ...current.current.selection, mode } }); return Promise.resolve(true); }
    return run((expectedOwner, isCurrent) => persist({ ...current.current, selection: { ...current.current.selection, mode } }, expectedOwner, isCurrent));
  };
  const setPhoto = (photo: string | null) => {
    const update = () => ({ ...current.current, photo, selection: { ...current.current.selection, photoId: null } });
    if (!userId) { commit(update()); return Promise.resolve(true); }
    return run((expectedOwner, isCurrent) => persist(update(), expectedOwner, isCurrent));
  };
  const setPersonal = (_personal: null) => run((expectedOwner, isCurrent) => persist({ ...current.current, personal: null, selection: { ...current.current.selection, personalProductId: null } }, expectedOwner, isCurrent));
  const removeProduct = (catalogId: string) => run((expectedOwner, isCurrent) => {
    const productIds = current.current.products.filter((item) => item.catalog_product_id === catalogId).map((item) => item.id);
    return persist({ ...current.current, selection: { ...current.current.selection, selectedProductIds: current.current.selection.selectedProductIds.filter((id) => !productIds.includes(id)) } }, expectedOwner, isCurrent);
  });
  const discoverSelection = inputs.products.filter((product) => inputs.selection.selectedProductIds.includes(product.id) && product.catalog_product_id);
  const selectedIds = discoverSelection.flatMap((product) => product.catalog_product_id ? [product.catalog_product_id] : []);
  const selectedInputProductId = inputs.selection.mode === "personal" ? inputs.selection.personalProductId : inputs.selection.selectedProductIds[0] ?? null;
  const selected: DiscoverProduct[] = inputs.selection.mode === "personal" ? inputs.personal ? [inputs.personal] : [] : discoverSelection.map((product) => ({ id: product.catalog_product_id ?? product.id, name: product.name, brand: product.brand ?? "", style: product.style ?? "", image: product.image_url ?? "", source: "discover", category: discoverCategories.find((category) => category === product.category) ?? "unknown" }));

  return { photo: inputs.photo, personal: inputs.personal, selectedIds, selected, selectedInputProductId, mode: inputs.selection.mode, setMode, setPhoto, setPersonal, selectProduct, removeProduct, uploadPhoto: (file: File) => upload(file, "photo"), uploadProduct: (file: File) => upload(file, "product"), savingInputs: saving || restoring || !authReady, inputError: error, retryInputs: () => retryAction.current?.(), signedIn: !!userId, photoId: inputs.selection.photoId, personalProductId: inputs.selection.personalProductId };
}