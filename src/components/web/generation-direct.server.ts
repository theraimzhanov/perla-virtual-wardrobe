import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { DIRECT_STALE_MS, nextDirectAction, providerBody, providerEndpoint, resultObjectPath, trustedMediaUrl, type AccessoryFit } from "./generation-rules";
import { boundedImage, classifyProduct, GenerationProviderError, pollPhoto, submitPhoto } from "./generation-provider.server";
import { uploadBucket } from "./upload-rules";
import { renderStudioImage } from "./studio-provider.server";

type Job = Tables<"generation_jobs">;

export function directConfig() {
  const perfectKey = process.env['PERFECT_CORP_API_KEY'];
  const geminiKey = process.env['GEMINI_API_KEY'];
  const supabaseOrigin = process.env['SUPABASE_URL'];
  if (!perfectKey || !geminiKey || !supabaseOrigin) throw new Error("Generation setup is not complete yet.");
  return { perfectKey, geminiKey, supabaseOrigin };
}

async function loadJob(id: string) {
  const { data, error } = await supabaseAdmin.from("generation_jobs").select("*").eq("id", id).eq("engine", "direct").single();
  if (error || !data) throw new Error("Generation job not found.");
  return data;
}

async function updateJob(id: string, values: TablesUpdate<"generation_jobs">) {
  const { error } = await supabaseAdmin.from("generation_jobs").update(values).eq("id", id).eq("engine", "direct").in("status", ["pending", "processing"]);
  if (error) throw new Error("Couldn't save generation progress.");
}

const fail = (id: string, message: string) => updateJob(id, { status: "failed", stage: "failed", error_message: message });
const staleBefore = () => new Date(Date.now() - DIRECT_STALE_MS).toISOString();

async function inputImages(job: Job, origin: string) {
  if (!job.photo_id || !job.product_id) throw new GenerationProviderError("Saved generation inputs are missing.");
  const [photo, product] = await Promise.all([
    supabaseAdmin.from("user_photos").select("storage_path").eq("id", job.photo_id).eq("user_id", job.user_id).single(),
    supabaseAdmin.from("try_on_products").select("storage_path,image_url").eq("id", job.product_id).eq("user_id", job.user_id).single(),
  ]);
  if (photo.error || !photo.data || product.error || !product.data) throw new GenerationProviderError("Your saved images are unavailable.");
  const storage = supabaseAdmin.storage.from(uploadBucket);
  const person = await storage.createSignedUrl(photo.data.storage_path, 3600);
  const item = product.data.storage_path ? await storage.createSignedUrl(product.data.storage_path, 3600) : null;
  const personUrl = person.data?.signedUrl;
  const itemUrl = item ? item.data?.signedUrl : product.data.image_url;
  if (!personUrl || !itemUrl) throw new GenerationProviderError("Couldn't open your saved images.", true);
  // An image outside PERLA storage can never pass, so fail at once instead of retrying forever.
  try { return { person: trustedMediaUrl(personUrl, "input", origin), item: trustedMediaUrl(itemUrl, "input", origin) }; }
  catch { throw new GenerationProviderError("This product image can't be used for try-on. Please choose another piece."); }
}

// Claim the preparation step so parallel status checks cannot submit the same request twice.
async function claim(id: string, from: string, to: string, extra: TablesUpdate<"generation_jobs"> = {}) {
  const { data, error } = await supabaseAdmin.from("generation_jobs").update({ status: "processing", stage: to, ...extra })
    .eq("id", id).eq("engine", "direct").in("status", ["pending", "processing"]).or(from.replace("$STALE", staleBefore())).select("id").maybeSingle();
  if (error) throw new Error("Couldn't prepare generation.");
  return Boolean(data);
}

// AI Studio photo: one claimed render through the AI gateway; an interrupted render is never repeated.
async function renderStudio(job: Job) {
  const config = directConfig();
  if (!await claim(job.id, "stage.in.(queued,ready)", "rendering", { provider_endpoint: "studio-image" })) return;
  let bytes: Uint8Array;
  try {
    const source = await boundedImage(trustedMediaUrl(job.item_image_url, "input", config.supabaseOrigin), 20 * 1024 * 1024);
    bytes = await renderStudioImage(source, job.studio_prompt ?? "");
  } catch (cause) {
    console.error("Studio render failed", cause instanceof Error ? cause.message : "unknown");
    return fail(job.id, cause instanceof GenerationProviderError ? cause.message : "AI Studio couldn't create this image. Please try again.");
  }
  const path = `${job.user_id}/studio/${job.id}.png`;
  const storage = supabaseAdmin.storage.from("generated-looks");
  const { error } = await storage.upload(path, bytes, { contentType: "image/png", upsert: true });
  if (error) return fail(job.id, "Couldn't save the new image. Please try again.");
  await updateJob(job.id, { status: "completed", stage: "completed", result_storage_path: path, result_image_url: storage.getPublicUrl(path).data.publicUrl, error_message: null });
}

async function submit(job: Job) {
  if (job.kind !== "photo") return fail(job.id, "Video generation is no longer available.");
  if (job.studio_scene) return renderStudio(job);
  const config = directConfig();
  // Prepare (classify / write motion prompt) under a claim; a stale claim can be retaken because nothing was sent yet.
  if (!await claim(job.id, "stage.in.(queued,ready),and(stage.eq.classifying,updated_at.lt.$STALE)", "classifying")) return;
  let send: () => Promise<{ taskId: string; endpoint: string }>;
  let endpoint: string;
  try {
    {
      const images = await inputImages(job, config.supabaseOrigin);
      let category = job.category;
      if (category === "unknown") {
        // Classify the job only: the personally uploaded product's own metadata remains unknown.
        category = await classifyProduct(images.item, config.geminiKey, config.supabaseOrigin);
        await updateJob(job.id, { category });
      }
      const fit = job.accessory_fit === "female" || job.accessory_fit === "male" ? job.accessory_fit as AccessoryFit : null;
      try { providerBody(category, images.person, images.item, fit); endpoint = providerEndpoint(category); }
      catch (cause) { throw new GenerationProviderError(cause instanceof Error ? cause.message : "This product can't be tried on."); }
      send = () => submitPhoto(category, images.person, images.item, fit, config.perfectKey);
    }
  } catch (cause) {
    if (cause instanceof GenerationProviderError && !cause.retryable) return fail(job.id, cause.message);
    await updateJob(job.id, { stage: "queued" }); // Nothing was sent: the next status check retries preparation.
    throw cause;
  }
  if (!await claim(job.id, "stage.eq.classifying", "submitting", { provider_endpoint: endpoint })) return;
  let task: { taskId: string; endpoint: string };
  try { task = await send(); }
  catch (cause) {
    console.error("Generation submit failed", cause instanceof Error ? `${cause.name}: ${cause.message}` : "unknown");
    // The provider has no documented idempotency, so an uncertain POST is never repeated.
    return fail(job.id, cause instanceof GenerationProviderError ? cause.message : "Submission status is uncertain, so it was not repeated. Please try again.");
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try { await updateJob(job.id, { provider_task_id: task.taskId, provider_endpoint: task.endpoint, stage: "polling" }); return; }
    catch (cause) { if (attempt === 2) throw cause; }
  }
}

async function pollAndSave(job: Job) {
  const config = directConfig();
  const taskId = job.provider_task_id ?? "";
  const result = await pollPhoto(job.provider_endpoint ?? "", taskId, config.perfectKey);
  if (!result.finished || !result.url) return;
  if (!await claim(job.id, "stage.eq.polling,and(stage.eq.saving,updated_at.lt.$STALE)", "saving")) return;
  try {
    const url = trustedMediaUrl(result.url, "result", config.supabaseOrigin);
    const storage = supabaseAdmin.storage.from("generated-looks");
    {
      const { bytes, mime } = await boundedImage(url, 20 * 1024 * 1024);
      const path = resultObjectPath(job.user_id, job.id, mime);
      const { error } = await storage.upload(path, bytes, { contentType: mime, upsert: true });
      if (error) throw new GenerationProviderError("Couldn't save the generated photo.", true);
      await updateJob(job.id, { status: "completed", stage: "completed", result_storage_path: path, result_image_url: storage.getPublicUrl(path).data.publicUrl, error_message: null });
    }
  } catch (cause) {
    if (cause instanceof GenerationProviderError && !cause.retryable) return fail(job.id, cause.message);
    await updateJob(job.id, { stage: "polling" }); // The provider result stays available; retry saving on the next check.
    throw cause;
  }
}

// Advance one saved direct job by one safe step. Called on creation and on every status check.
export async function advanceDirectJob(id: string) {
  try {
    const job = await loadJob(id);
    const action = nextDirectAction(job, Date.now());
    if (action === "submit") await submit(job);
    else if (action === "uncertain") await fail(id, "Submission status is uncertain, so it was not repeated. Please try again.");
    else if (action === "expired") await fail(id, `This ${job.studio_scene ? "AI Studio image" : "try-on"} took too long, so it was stopped. Please try again.`);
    else if (action === "poll") await pollAndSave(job);
  } catch (cause) {
    if (cause instanceof GenerationProviderError && !cause.retryable) { await fail(id, cause.message).catch(() => undefined); return; }
    // Temporary problems are retried by the next status check; never expose provider details.
    console.error("Generation step will retry", cause instanceof Error ? cause.message : "unknown");
  }
}
