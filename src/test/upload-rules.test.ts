import { describe, expect, it, vi } from "vitest";
import { discoverSnapshot, inputSelectionSchema, personalUpload, saveUploadedInput, uploadPath, validateImage, validateUploadOwner } from "@/components/web/upload-rules";

describe("Saved upload rules", () => {
  it("starts a personal upload with unknown category and no guessed brand or style", () => {
    expect(personalUpload("upload", "handbag.png", "photo")).toEqual({ id: "upload", name: "handbag", image: "photo", source: "personal", category: "unknown", brand: "", style: "" });
  });
  it("retains the Discover image, product identity, source and category", () => {
    expect(discoverSnapshot({ id: "bag-id", name: "Bag", brand: "Brand", style: "Classic", image: "https://example.com/bag.jpg", category: "Bag", source: "discover" })).toEqual({ catalog_product_id: "bag-id", name: "Bag", brand: "Brand", style: "Classic", image_url: "https://example.com/bag.jpg", category: "Bag", source: "discover" });
  });
  it("rejects storage paths belonging to another owner", () => {
    const metadata = { id: "file", kind: "photo" as const, storagePath: uploadPath("owner-b", "file", "photo", "image/png"), filename: "photo.png", mimeType: "image/png" as const, fileSize: 42 };
    expect(() => validateUploadOwner("owner-a", metadata)).toThrow("does not belong");
    expect(() => validateUploadOwner("owner-b", metadata)).not.toThrow();
  });
  it("requires valid saved product record identifiers", () => {
    expect(inputSelectionSchema.safeParse({ photoId: null, personalProductId: null, mode: "personal", selectedProductIds: ["another-user-file-path"] }).success).toBe(false);
  });
  it("rejects invalid image types and files over the storage limit", () => {
    expect(() => validateImage({ name: "file.gif", type: "image/gif", size: 5 })).toThrow("JPG");
    expect(() => validateImage({ name: "file.png", type: "image/png", size: 10485761 })).toThrow("10 MB");
    expect(() => validateImage({ name: "file.png", type: "image/png", size: 10485760 })).not.toThrow();
  });
  it("does not save metadata when the storage upload fails", async () => {
    const save = vi.fn();
    await expect(saveUploadedInput({ upload: async () => { throw new Error("Upload failed"); }, save, cleanup: vi.fn() })).rejects.toThrow("Upload failed");
    expect(save).not.toHaveBeenCalled();
  });
  it("cleans up the file and rejects when metadata saving fails", async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    await expect(saveUploadedInput({ upload: async () => {}, save: async () => { throw new Error("Save failed"); }, cleanup })).rejects.toThrow("Save failed");
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});