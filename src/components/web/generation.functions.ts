import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { uploadBucket } from "./upload-rules";

const LINK_SECONDS = 60 * 60 * 24;

// Creates a pending try-on job from the user's saved photo and first selected product.
// A Supabase database webhook on generation_jobs (INSERT) forwards the row to n8n.
export const createGenerationJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ expectedOwner: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedOwner !== context.userId) throw new Error("Your account changed. Please try again.");
    const { data: inputs, error } = await context.supabase.from("try_on_inputs").select("*").eq("user_id", context.userId).maybeSingle();
    if (error || !inputs?.photo_id) throw new Error("Upload your photo before generating.");
    const productId = inputs.product_mode === "personal" ? inputs.personal_product_id : inputs.selected_product_ids[0];
    if (!productId) throw new Error("Select a product before generating.");
    const [photoRes, productRes] = await Promise.all([
      context.supabase.from("user_photos").select("*").eq("id", inputs.photo_id).eq("user_id", context.userId).single(),
      context.supabase.from("try_on_products").select("*").eq("id", productId).eq("user_id", context.userId).single(),
    ]);
    if (photoRes.error || !photoRes.data || productRes.error || !productRes.data) throw new Error("Couldn't find your saved photo or product.");
    const product = productRes.data;
    const storage = context.supabase.storage.from(uploadBucket);
    const person = await storage.createSignedUrl(photoRes.data.storage_path, LINK_SECONDS);
    const item = product.storage_path ? await storage.createSignedUrl(product.storage_path, LINK_SECONDS) : null;
    const itemUrl = item ? item.data?.signedUrl : product.image_url;
    if (!person.data?.signedUrl || !itemUrl) throw new Error("Couldn't prepare your images. Please retry.");
    const { data: job, error: jobError } = await context.supabase.from("generation_jobs").insert({
      user_id: context.userId,
      kind: "photo",
      status: "pending",
      category: product.category,
      photo_id: photoRes.data.id,
      product_id: product.id,
      person_image_url: person.data.signedUrl,
      item_image_url: itemUrl,
      product_name: product.name,
      brand_name: product.brand,
    }).select("id").single();
    if (jobError || !job) throw new Error("Couldn't start your try-on. Please retry.");
    return { jobId: job.id };
  });
