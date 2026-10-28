import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { uploadBucket } from "./upload-rules";
import { directGenerationEnabled, generationRequestSchema, videoRequestSchema, type PhotoJob } from "./generation-rules";

const LINK_SECONDS = 60 * 60 * 24;

// Owner-scoped input reads precede privileged, trusted job creation.
export const createGenerationJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => generationRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedOwner !== context.userId) throw new Error("Your account changed. Please try again.");
    // The legacy n8n processor stays available behind the activation flag.
    const direct = directGenerationEnabled(process.env['PERLA_DIRECT_GENERATION_ENABLED']);
    const { directConfig, advanceDirectJob } = await import("./generation-direct.server");
    if (direct) directConfig();
    // Direct jobs are prepared and submitted here; later status checks poll and save the result.
    const dispatch = async (id: string, engine: string) => {
      if (engine === "direct") await advanceDirectJob(id);
    };
    const existing = await context.supabase.from("generation_jobs").select("id,engine,status").eq("user_id", context.userId).eq("request_id", data.requestId).maybeSingle();
    if (existing.error) throw new Error("Couldn't check this request.");
    if (existing.data) {
      if (["pending", "processing"].includes(existing.data.status)) await dispatch(existing.data.id, existing.data.engine);
      return { jobId: existing.data.id };
    }
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
    if (["Bag", "Hat"].includes(product.category) && !data.accessoryFit) throw new Error("Choose an accessory fit for this bag or hat.");
    const storage = context.supabase.storage.from(uploadBucket);
    const person = await storage.createSignedUrl(photoRes.data.storage_path, LINK_SECONDS);
    const item = product.storage_path ? await storage.createSignedUrl(product.storage_path, LINK_SECONDS) : null;
    const itemUrl = item ? item.data?.signedUrl : product.image_url;
    if (!person.data?.signedUrl || !itemUrl) throw new Error("Couldn't prepare your images. Please retry.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job, error: jobError } = await supabaseAdmin.from("generation_jobs").insert({
      user_id: context.userId,
      engine: direct ? "direct" : "n8n",
      request_id: data.requestId,
      source: inputs.product_mode === "personal" ? "own" : "discover",
      accessory_fit: data.accessoryFit,
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
    if (jobError?.code === "23505") {
      const duplicate = await context.supabase.from("generation_jobs").select("id,engine,status").eq("user_id", context.userId).eq("request_id", data.requestId).single();
      if (!duplicate.data) throw new Error("Couldn't restore this request.");
      if (["pending", "processing"].includes(duplicate.data.status)) await dispatch(duplicate.data.id, duplicate.data.engine);
      return { jobId: duplicate.data.id };
    }
    if (jobError || !job) throw new Error("Couldn't start your try-on. Please retry.");
    await dispatch(job.id, direct ? "direct" : "n8n");
    return { jobId: job.id };
  });

// Videos always run on the app's own processor: they animate a finished, owner-scoped photo.
export const createVideoJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => videoRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedOwner !== context.userId) throw new Error("Your account changed. Please try again.");
    const { directConfig, advanceDirectJob } = await import("./generation-direct.server");
    directConfig();
    const existing = await context.supabase.from("generation_jobs").select("id,status").eq("user_id", context.userId).eq("request_id", data.requestId).maybeSingle();
    if (existing.error) throw new Error("Couldn't check this request.");
    if (existing.data) {
      if (["pending", "processing"].includes(existing.data.status)) await advanceDirectJob(existing.data.id);
      return { jobId: existing.data.id };
    }
    const { data: photo, error } = await context.supabase.from("generation_jobs").select("*").eq("id", data.photoJobId).eq("user_id", context.userId).eq("kind", "photo").eq("status", "completed").is("deleted_at", null).single();
    if (error || !photo?.result_image_url) throw new Error("Generate a try-on photo before making a video.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job, error: jobError } = await supabaseAdmin.from("generation_jobs").insert({
      user_id: context.userId, engine: "direct", request_id: data.requestId, kind: "video", status: "pending", parent_job_id: photo.id,
      source: photo.source, category: photo.category, photo_id: photo.photo_id, product_id: photo.product_id,
      person_image_url: photo.result_image_url, item_image_url: photo.result_image_url,
      product_name: photo.product_name, brand_name: photo.brand_name,
    }).select("id").single();
    if (jobError || !job) throw new Error("Couldn't start your video. Please retry.");
    await advanceDirectJob(job.id);
    return { jobId: job.id };
  });

type JobRow = import("@/integrations/supabase/types").Tables<"generation_jobs">;
function jobDto(row: JobRow, extra: { likes?: number; liked?: boolean; feedbackSent?: boolean } = {}): PhotoJob {
  return { id: row.id, kind: row.kind === "video" ? "video" : "photo", status: row.status, stage: row.stage, image: row.result_image_url, video: row.result_video_url, error: row.error_message, title: row.product_name ?? "New look", brand: row.brand_name, source: row.source === "own" || row.source === "internet" || row.source === "store" ? row.source : "discover", liked: extra.liked ?? false, likes: extra.likes ?? 0, feedbackSent: extra.feedbackSent ?? false, shared: row.shared, photoId: row.photo_id, productId: row.product_id, parentJobId: row.parent_job_id, createdAt: row.created_at };
}

// Like counts span all users, so they are read with the admin client after the owner-scoped job read.
async function decorate(rows: JobRow[], userId: string, supabase: SupabaseClient<Database>) {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [likes, feedback] = await Promise.all([
    supabaseAdmin.from("look_likes").select("job_id,user_id").in("job_id", ids),
    supabase.from("feedback_answers").select("job_id").eq("user_id", userId).in("job_id", ids),
  ]);
  const likeRows = likes.data ?? [];
  const sent = new Set((feedback.data ?? []).map((row) => row.job_id));
  return rows.map((row) => jobDto(row, { likes: likeRows.filter((like) => like.job_id === row.id).length, liked: likeRows.some((like) => like.job_id === row.id && like.user_id === userId), feedbackSent: sent.has(row.id) }));
}

export const listPhotoJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("generation_jobs").select("*").eq("user_id", context.userId).is("deleted_at", null).order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error("Couldn't load your generated looks.");
    return decorate(data ?? [], context.userId, context.supabase);
  });

export const getPhotoJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const read = () => context.supabase.from("generation_jobs").select("*").eq("id", data.id).eq("user_id", context.userId).is("deleted_at", null).single();
    let { data: row, error } = await read();
    if (error || !row) throw new Error("Couldn't find this generation request.");
    // Each owner status check advances an unfinished direct job by one step (poll, then save).
    if (row.engine === "direct" && ["pending", "processing"].includes(row.status)) {
      const { advanceDirectJob } = await import("./generation-direct.server");
      await advanceDirectJob(row.id);
      ({ data: row, error } = await read());
      if (error || !row) throw new Error("Couldn't find this generation request.");
    }
    return (await decorate([row], context.userId, context.supabase))[0]!;
  });

export const changeGeneratedLook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), shared: z.boolean().optional(), deleted: z.literal(true).optional(), source: z.enum(["own", "internet", "store"]).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: owned, error } = await context.supabase.from("generation_jobs").select("id,status,source").eq("id", data.id).eq("user_id", context.userId).single();
    if (error || !owned) throw new Error("This saved look is unavailable.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.deleted) {
      // Deleting a photo also removes the videos made from it; stored files go first so nothing is orphaned.
      const { data: family } = await supabaseAdmin.from("generation_jobs").select("id,result_storage_path").eq("user_id", context.userId).or(`id.eq.${data.id},parent_job_id.eq.${data.id}`);
      const paths = (family ?? []).map((row) => row.result_storage_path).filter((path): path is string => Boolean(path));
      if (paths.length) await supabaseAdmin.storage.from("generated-looks").remove(paths);
      const { error: deleteError } = await supabaseAdmin.from("generation_jobs").delete().eq("user_id", context.userId).or(`id.eq.${data.id},parent_job_id.eq.${data.id}`);
      if (deleteError) throw new Error("Couldn't delete this look.");
      return { saved: true };
    }
    if (owned.status !== "completed") throw new Error("This look isn't finished yet.");
    if (data.source && owned.source === "discover") throw new Error("Discover product origins cannot change.");
    const { error: updateError } = await supabaseAdmin.from("generation_jobs").update({
      ...(data.shared !== undefined ? { shared: data.shared } : {}), ...(data.source ? { source: data.source } : {}),
    }).eq("id", data.id).eq("user_id", context.userId);
    if (updateError) throw new Error("Couldn't save your change.");
    return { saved: true };
  });
