import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { emptyInputSelection, inputSelectionSchema, uploadBucket, uploadMetadataSchema, uploadedProductName, validateUploadOwner } from "./upload-rules";

export const getSavedInputs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: selection, error } = await context.supabase.from("try_on_inputs").select("*").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error("Couldn't load your saved selection. Please retry.");
    const ids = [...(selection?.selected_product_ids ?? []), ...(selection?.personal_product_id ? [selection.personal_product_id] : [])];
    const [photoResult, productsResult] = await Promise.all([
      selection?.photo_id ? context.supabase.from("user_photos").select("*").eq("id", selection.photo_id).eq("user_id", context.userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      ids.length ? context.supabase.from("try_on_products").select("*").eq("user_id", context.userId).in("id", ids) : Promise.resolve({ data: [], error: null }),
    ]);
    if (photoResult.error || productsResult.error) throw new Error("Couldn't load your saved photos. Please retry.");
    return {
      selection: selection ? inputSelectionSchema.parse({ photoId: selection.photo_id, personalProductId: selection.personal_product_id, mode: selection.product_mode, selectedProductIds: selection.selected_product_ids }) : emptyInputSelection(),
      photo: photoResult.data,
      products: productsResult.data ?? [],
    };
  });

export const registerUploadedInput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => uploadMetadataSchema.parse(input))
  .handler(async ({ data, context }) => {
    validateUploadOwner(context.userId, data);
    // Download using the owner's session to verify the file exists and its type/size.
    const { data: file, error: fileError } = await context.supabase.storage.from(uploadBucket).download(data.storagePath);
    if (fileError || !file || file.size !== data.fileSize || file.type.split(";")[0] !== data.mimeType) throw new Error("Couldn't verify this uploaded image. Please try again.");
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const validSignature = data.mimeType === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : data.mimeType === "image/png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
      : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!validSignature) throw new Error("This file is not a valid JPG, PNG or WebP image.");
    const { error: profileError } = await context.supabase.from("profiles").upsert({ id: context.userId }, { onConflict: "id", ignoreDuplicates: true });
    if (profileError) throw new Error("Couldn't save your account details. Please try again.");
    const metadata = { id: data.id, user_id: context.userId, storage_path: data.storagePath, original_filename: data.filename, mime_type: data.mimeType, file_size: data.fileSize };
    const result = data.kind === "photo"
      ? await context.supabase.from("user_photos").insert(metadata).select("id").single()
      : await context.supabase.from("try_on_products").insert({ ...metadata, source: "upload", category: "unknown", name: uploadedProductName(data.filename) }).select("id").single();
    if (result.error || !result.data) throw new Error("Couldn't save this image. Please try again.");
    return { id: result.data.id };
  });

export const saveDiscoverInput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ catalogId: z.string().uuid(), expectedOwner: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedOwner !== context.userId) throw new Error("Your account changed. Please try again.");
    const { data: existing, error: readError } = await context.supabase.from("try_on_products").select("*").eq("user_id", context.userId).eq("catalog_product_id", data.catalogId).maybeSingle();
    if (readError) throw new Error("Couldn't save this product. Please try again.");
    if (existing) return existing;
    const { data: product, error: catalogError } = await context.supabase.from("products").select("*").eq("id", data.catalogId).single();
    if (catalogError || !product) throw new Error("This product is unavailable. Choose another piece.");
    const { error: profileError } = await context.supabase.from("profiles").upsert({ id: context.userId }, { onConflict: "id", ignoreDuplicates: true });
    if (profileError) throw new Error("Couldn't save your account details. Please try again.");
    const { data: row, error } = await context.supabase.from("try_on_products").insert({ user_id: context.userId, catalog_product_id: product.id, source: "discover", name: product.name, brand: product.brand, style: product.style, category: product.category, image_url: product.image_url }).select("*").single();
    if (error || !row) throw new Error("Couldn't save this product. Please try again.");
    return row;
  });

export const saveInputSelection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSelectionSchema.extend({ expectedOwner: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedOwner !== context.userId) throw new Error("Your account changed. Please try again.");
    const { error: profileError } = await context.supabase.from("profiles").upsert({ id: context.userId }, { onConflict: "id", ignoreDuplicates: true });
    if (profileError) throw new Error("Couldn't save your account details. Please try again.");
    const { error } = await context.supabase.from("try_on_inputs").upsert({ user_id: context.userId, photo_id: data.photoId, personal_product_id: data.personalProductId, product_mode: data.mode, selected_product_ids: [...new Set(data.selectedProductIds)] });
    if (error) throw new Error("Couldn't save your selection. Please retry.");
    return { saved: true };
  });