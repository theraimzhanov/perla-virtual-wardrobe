import { z } from "zod";
import type { DiscoverProduct } from "./data";

export const uploadBucket = "user-uploads";
export const maxImageBytes = 10 * 1024 * 1024;
export const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const uploadMetadataSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["photo", "product"]),
  storagePath: z.string().min(1).max(256),
  filename: z.string().min(1).max(255),
  mimeType: z.enum(imageTypes),
  fileSize: z.number().int().positive().max(maxImageBytes),
});
export const inputSelectionSchema = z.object({
  photoId: z.string().uuid().nullable(),
  personalProductId: z.string().uuid().nullable(),
  mode: z.enum(["discover", "personal"]),
  selectedProductIds: z.array(z.string().uuid()).max(100),
});
export type InputSelection = z.infer<typeof inputSelectionSchema>;
export const emptyInputSelection = (): InputSelection => ({ photoId: null, personalProductId: null, mode: "discover", selectedProductIds: [] });

export function validateImage(file: Pick<File, "name" | "type" | "size">) {
  if (!imageTypes.some((type) => type === file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size <= 0 || file.size > maxImageBytes) throw new Error("Choose an image smaller than 10 MB.");
  if (!file.name || file.name.length > 255) throw new Error("Choose an image with a shorter filename.");
}

export function uploadPath(userId: string, id: string, kind: "photo" | "product", mimeType: string) {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
  return `${userId}/${kind === "photo" ? "photos" : "products"}/${id}.${extension}`;
}

export function validateUploadOwner(userId: string, input: z.infer<typeof uploadMetadataSchema>) {
  if (input.storagePath !== uploadPath(userId, input.id, input.kind, input.mimeType)) throw new Error("This upload does not belong to your account.");
}

export function uploadedProductName(filename: string) {
  return filename.replace(/\.[^.]+$/, "").trim().slice(0, 255) || "Uploaded product";
}

export function personalUpload(id: string, filename: string, image: string): DiscoverProduct {
  return { id, name: uploadedProductName(filename), brand: "", style: "", image, category: "unknown", source: "personal" };
}

export function discoverSnapshot(product: DiscoverProduct) {
  return { catalog_product_id: product.id, source: "discover" as const, name: product.name, brand: product.brand, style: product.style, category: product.category, image_url: product.image };
}

// Complete storage and metadata saving before making an upload available in the UI.
export async function saveUploadedInput<T>(operations: { upload: () => Promise<void>; save: () => Promise<T>; cleanup: () => Promise<void> }) {
  await operations.upload();
  try { return await operations.save(); }
  catch (error) { await operations.cleanup().catch(() => undefined); throw error; }
}