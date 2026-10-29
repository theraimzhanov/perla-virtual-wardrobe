import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSavedTryOnInputs } from "@/components/web/useSavedTryOnInputs";

const mocks = vi.hoisted(() => ({ load: vi.fn(), register: vi.fn(), discover: vi.fn(), persist: vi.fn(), sign: vi.fn(), upload: vi.fn(), remove: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/components/web/uploads.functions", () => ({ getSavedInputs: mocks.load, registerUploadedInput: mocks.register, saveDiscoverInput: mocks.discover, saveInputSelection: mocks.persist }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from: () => ({ createSignedUrl: mocks.sign, upload: mocks.upload, remove: mocks.remove }) } } }));

const owner = "11111111-1111-4111-8111-111111111111";
const otherOwner = "22222222-2222-4222-8222-222222222222";
const photoId = "33333333-3333-4333-8333-333333333333";
const productId = "44444444-4444-4444-8444-444444444444";
const catalogId = "55555555-5555-4555-8555-555555555555";
const selection = { photoId: null, personalProductId: null, mode: "discover", selectedProductIds: [] };

describe("Account-scoped saved Try-On inputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.load.mockResolvedValue({ selection: { ...selection }, photo: null, products: [] });
    mocks.sign.mockImplementation(async (path: string) => ({ data: { signedUrl: `https://storage.example/${path}` }, error: null }));
    mocks.upload.mockResolvedValue({ error: null });
    mocks.register.mockImplementation(async ({ data }: { data: { id: string } }) => ({ id: data.id }));
    mocks.persist.mockResolvedValue({ saved: true });
    mocks.remove.mockResolvedValue({ error: null });
  });
  it("restores saved photo and Discover product from permanent records", async () => {
    mocks.load.mockResolvedValue({ selection: { ...selection, photoId, selectedProductIds: [productId] }, photo: { id: photoId, storage_path: `${owner}/photos/photo.png` }, products: [{ id: productId, catalog_product_id: catalogId, source: "discover", category: "Bag", name: "New bag", brand: "Brand", style: "Classic", image_url: "https://storage.example/bag.png" }] });
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.savingInputs).toBe(false));
    expect(result.current.photo).toBe(`https://storage.example/${owner}/photos/photo.png`);
    expect(result.current.selectedIds).toEqual([catalogId]);
    expect(result.current.selected[0]?.category).toBe("Bag");
    expect(mocks.persist).not.toHaveBeenCalled();
  });
  it("saves uploaded product as unknown and persists its selected record", async () => {
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.savingInputs).toBe(false));
    await act(async () => { await result.current.uploadProduct(new File(["image"], "purse.png", { type: "image/png" })); });
    expect(result.current.personal?.category).toBe("unknown");
    expect(result.current.personal?.brand).toBe("");
    expect(mocks.register.mock.calls[0]?.[0].data.kind).toBe("product");
    expect(mocks.persist.mock.calls[0]?.[0].data).toMatchObject({ personalProductId: result.current.personal?.id, mode: "personal", expectedOwner: owner });
  });
  it("a successful local product upload removes the Discover action and persists only the uploaded product", async () => {
    mocks.load.mockResolvedValue({ selection: { ...selection, selectedProductIds: [productId] }, photo: null, products: [{ id: productId, catalog_product_id: catalogId, category: "Clothes", name: "First piece", image_url: "first.jpg" }] });
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.selectedIds).toEqual([catalogId]));
    await act(async () => { await result.current.uploadProduct(new File(["image"], "replacement.png", { type: "image/png" })); });
    expect(result.current.mode).toBe("personal");
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.selected).toHaveLength(1);
    expect(mocks.persist.mock.calls[0]?.[0].data.selectedProductIds).toEqual([]);
  });
  it("a Discover selection clears a previous local product selection", async () => {
    mocks.load.mockResolvedValue({ selection: { ...selection, mode: "personal", personalProductId: productId }, photo: null, products: [{ id: productId, category: "unknown", name: "Upload", storage_path: `${owner}/products/local.png` }] });
    const discoveredId = "66666666-6666-4666-8666-666666666666";
    mocks.discover.mockResolvedValue({ id: discoveredId, catalog_product_id: catalogId, category: "Hat", name: "Hat", image_url: "hat.jpg" });
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.personal?.id).toBe(productId));
    await act(async () => { await result.current.selectProduct(catalogId); });
    expect(result.current.personal).toBeNull();
    expect(result.current.personalProductId).toBeNull();
    expect(result.current.selectedIds).toEqual([catalogId]);
    expect(mocks.persist.mock.calls[0]?.[0].data).toMatchObject({ mode: "discover", personalProductId: null, selectedProductIds: [discoveredId] });
  });
  it("a failed local replacement does not remove the existing Discover product", async () => {
    mocks.load.mockResolvedValue({ selection: { ...selection, selectedProductIds: [productId] }, photo: null, products: [{ id: productId, catalog_product_id: catalogId, category: "Clothes", name: "First piece", image_url: "first.jpg" }] });
    mocks.upload.mockResolvedValue({ error: new Error("Unavailable") });
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.selectedIds).toEqual([catalogId]));
    await act(async () => { await result.current.uploadProduct(new File(["image"], "replacement.png", { type: "image/png" })); });
    expect(result.current.mode).toBe("discover");
    expect(result.current.selectedIds).toEqual([catalogId]);
    expect(mocks.persist).not.toHaveBeenCalled();
  });
  it("a new Discover product replaces rather than accumulates previous products", async () => {
    const replacementId = "66666666-6666-4666-8666-666666666666";
    const replacementCatalog = "77777777-7777-4777-8777-777777777777";
    mocks.load.mockResolvedValue({ selection: { ...selection, selectedProductIds: [productId] }, photo: null, products: [{ id: productId, catalog_product_id: catalogId, category: "Clothes", name: "First", image_url: "first.jpg" }] });
    mocks.discover.mockResolvedValue({ id: replacementId, catalog_product_id: replacementCatalog, category: "Hat", name: "Second", image_url: "second.jpg" });
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.selectedIds).toEqual([catalogId]));
    await act(async () => { await result.current.selectProduct(replacementCatalog); });
    expect(result.current.selectedIds).toEqual([replacementCatalog]);
    expect(mocks.persist.mock.calls[0]?.[0].data.selectedProductIds).toEqual([replacementId]);
  });
  it("restores a personal upload without reviving older Discover actions", async () => {
    mocks.load.mockResolvedValue({ selection: { ...selection, mode: "personal", personalProductId: productId, selectedProductIds: ["66666666-6666-4666-8666-666666666666"] }, photo: null, products: [{ id: productId, category: "unknown", name: "Local", storage_path: `${owner}/products/local.png` }, { id: "66666666-6666-4666-8666-666666666666", catalog_product_id: catalogId, category: "Clothes", name: "Old Discover", image_url: "old.jpg" }] });
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.personal?.id).toBe(productId));
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.selected.map((p) => p.id)).toEqual([productId]);
  });
  it("opening the local upload source without choosing a file does not overwrite the saved Discover action", async () => {
    mocks.load.mockResolvedValue({ selection: { ...selection, selectedProductIds: [productId] }, photo: null, products: [{ id: productId, catalog_product_id: catalogId, category: "Clothes", name: "First", image_url: "first.jpg" }] });
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.selectedIds).toEqual([catalogId]));
    await act(async () => { await result.current.setMode("personal"); });
    expect(mocks.persist).not.toHaveBeenCalled();
    await act(async () => { await result.current.setMode("discover"); });
    expect(result.current.selectedIds).toEqual([catalogId]);
  });
  it("keeps the previous photo if a replacement cannot upload", async () => {
    mocks.load.mockResolvedValue({ selection: { ...selection, photoId }, photo: { id: photoId, storage_path: `${owner}/photos/existing.png` }, products: [] });
    mocks.upload.mockResolvedValue({ error: new Error("Connection unavailable") });
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.savingInputs).toBe(false));
    await act(async () => { await result.current.uploadPhoto(new File(["new image"], "new.png", { type: "image/png" })); });
    expect(result.current.photo).toContain("existing.png");
    expect(result.current.inputError).toContain("Couldn't upload");
    expect(mocks.persist).not.toHaveBeenCalled();
  });
  it("saves a photo and reads it back when Try-On reopens", async () => {
    const first = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(first.result.current.savingInputs).toBe(false));
    await act(async () => { await first.result.current.uploadPhoto(new File(["image"], "selfie.png", { type: "image/png" })); });
    const metadata = mocks.register.mock.calls[0]?.[0].data;
    const savedSelection = mocks.persist.mock.calls[0]?.[0].data;
    expect(savedSelection.photoId).toBe(metadata.id);
    expect(metadata.storagePath).toContain(`${owner}/photos/`);
    first.unmount();
    mocks.load.mockResolvedValue({ selection: savedSelection, photo: { id: metadata.id, storage_path: metadata.storagePath }, products: [] });
    const second = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(second.result.current.photoId).toBe(metadata.id));
    expect(second.result.current.photo).toBe(`https://storage.example/${metadata.storagePath}`);
  });
  it("blocks new inputs while saved selections are still loading", async () => {
    let complete: ((value: unknown) => void) | undefined;
    mocks.load.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    expect(result.current.savingInputs).toBe(true);
    await act(async () => { complete?.({ selection: { ...selection }, photo: null, products: [] }); });
    await waitFor(() => expect(result.current.savingInputs).toBe(false));
  });
  it("removes the current photo reference without deleting its saved history", async () => {
    mocks.load.mockResolvedValue({ selection: { ...selection, photoId }, photo: { id: photoId, storage_path: `${owner}/photos/existing.png` }, products: [] });
    const { result } = renderHook(() => useSavedTryOnInputs(owner, true));
    await waitFor(() => expect(result.current.savingInputs).toBe(false));
    await act(async () => { await result.current.setPhoto(null); });
    expect(result.current.photo).toBeNull();
    expect(mocks.persist.mock.calls[0]?.[0].data.photoId).toBeNull();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("rejects signed-out uploads without saving anything", async () => {
    const { result } = renderHook(() => useSavedTryOnInputs(null, true));
    await act(async () => { await result.current.uploadPhoto(new File(["image"], "new.png", { type: "image/png" })); });
    expect(result.current.inputError).toContain("Sign in");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.register).not.toHaveBeenCalled();
  });
  it("clears the previous owner's private photo on an account change", async () => {
    mocks.load.mockResolvedValueOnce({ selection: { ...selection, photoId }, photo: { id: photoId, storage_path: `${owner}/photos/existing.png` }, products: [] });
    const { result, rerender } = renderHook(({ userId }) => useSavedTryOnInputs(userId, true), { initialProps: { userId: owner } });
    await waitFor(() => expect(result.current.photo).toContain("existing.png"));
    rerender({ userId: otherOwner });
    await waitFor(() => expect(result.current.savingInputs).toBe(false));
    expect(result.current.photo).toBeNull();
    expect(result.current.selectedIds).toEqual([]);
  });
});