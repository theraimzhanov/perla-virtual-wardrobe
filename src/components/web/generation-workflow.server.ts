import { Client as WorkflowClient, WorkflowNonRetryableError, type WorkflowContext } from "@upstash/workflow";
import { Receiver, Client as QStashClient } from "@upstash/qstash";
import { serve } from "@upstash/workflow/tanstack";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generationPayloadSchema, providerEndpoint, providerBody, resultObjectPath, trustedMediaUrl, type AccessoryFit } from "./generation-rules";
import { boundedImage, classifyProduct, GenerationProviderError, pollPhoto, submitPhoto } from "./generation-provider.server";
import { uploadBucket } from "./upload-rules";

export function generationConfig() {
  const token = process.env['QSTASH_TOKEN'];
  const currentSigningKey = process.env['QSTASH_CURRENT_SIGNING_KEY'];
  const nextSigningKey = process.env['QSTASH_NEXT_SIGNING_KEY'];
  const perfectKey = process.env['PERFECT_CORP_API_KEY'];
  const geminiKey = process.env['GEMINI_API_KEY'];
  const url = process.env['PERLA_GENERATION_URL'];
  const supabaseOrigin = process.env['SUPABASE_URL'];
  if (!token || !currentSigningKey || !nextSigningKey || !perfectKey || !geminiKey || !url || !supabaseOrigin) throw new Error("Photo generation setup is not complete yet.");
  const callback = new URL(url);
  if (callback.protocol !== "https:" || callback.pathname !== "/api/public/generation/photo") throw new Error("Photo generation callback needs checking.");
  return { token, currentSigningKey, nextSigningKey, perfectKey, geminiKey, url, supabaseOrigin };
}

export async function enqueuePhoto(jobId: string) {
  const config = generationConfig();
  const client = new WorkflowClient({ token: config.token });
  await client.trigger({ url: config.url, body: { jobId }, workflowRunId: `photo-${jobId}`, retries: 3 });
}

async function loadJob(id: string) {
  const { data, error } = await supabaseAdmin.from("generation_jobs").select("*").eq("id", id).eq("engine", "direct").single();
  if (error || !data) throw new WorkflowNonRetryableError("Generation job not found.");
  return data;
}

async function updateJob(id: string, values: import("@/integrations/supabase/types").TablesUpdate<"generation_jobs">) {
  const { error } = await supabaseAdmin.from("generation_jobs").update(values).eq("id", id).eq("engine", "direct").in("status", ["pending", "processing"]);
  if (error) throw new Error("Couldn't save generation progress.");
}

async function imagesForJob(job: Awaited<ReturnType<typeof loadJob>>) {
  if (!job.photo_id || !job.product_id) throw new WorkflowNonRetryableError("Saved generation inputs are missing.");
  const [photo, product] = await Promise.all([
    supabaseAdmin.from("user_photos").select("storage_path").eq("id", job.photo_id).eq("user_id", job.user_id).single(),
    supabaseAdmin.from("try_on_products").select("storage_path,image_url").eq("id", job.product_id).eq("user_id", job.user_id).single(),
  ]);
  if (photo.error || !photo.data || product.error || !product.data) throw new WorkflowNonRetryableError("Your saved images are unavailable.");
  const storage = supabaseAdmin.storage.from(uploadBucket);
  const person = await storage.createSignedUrl(photo.data.storage_path, 3600);
  const item = product.data.storage_path ? await storage.createSignedUrl(product.data.storage_path, 3600) : null;
  const personUrl = person.data?.signedUrl;
  const itemUrl = item ? item.data?.signedUrl : product.data.image_url;
  if (!personUrl || !itemUrl) throw new Error("Couldn't open your saved images.");
  const origin = generationConfig().supabaseOrigin;
  return { person: trustedMediaUrl(personUrl, "input", origin), item: trustedMediaUrl(itemUrl, "input", origin) };
}

async function safeStep<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    if (error instanceof GenerationProviderError && !error.retryable) throw new WorkflowNonRetryableError(error.message);
    throw error;
  }
}

export async function runPhotoWorkflow(context: WorkflowContext<{ jobId: string }>) {
  const { jobId } = generationPayloadSchema.parse(context.requestPayload);
  const initial = await context.run("load-job", () => loadJob(jobId));
  if (["completed", "failed"].includes(initial.status)) return;
  const category = await context.run("classify-product", () => safeStep(async () => {
    const job = await loadJob(jobId);
    if (job.category !== "unknown") { providerEndpoint(job.category); return job.category; }
    await updateJob(jobId, { status: "processing", stage: "classifying" });
    const { item } = await imagesForJob(job);
    const detected = await classifyProduct(item, generationConfig().geminiKey, generationConfig().supabaseOrigin);
    // Classify the job only: personally uploaded product metadata remains unknown.
    await updateJob(jobId, { category: detected, stage: "ready" });
    return detected;
  }));
  const task = await context.run("submit-photo-once", async () => {
    const job = await loadJob(jobId);
    if (job.provider_task_id && job.provider_endpoint) return { taskId: job.provider_task_id, endpoint: job.provider_endpoint };
    if (job.stage === "submitting") throw new WorkflowNonRetryableError("Submission status is uncertain. It was not repeated to avoid a duplicate charge.");
    const images = await imagesForJob(job);
    const fit = job.accessory_fit === "female" || job.accessory_fit === "male" ? job.accessory_fit as AccessoryFit : null;
    providerBody(category, images.person, images.item, fit);
    const { data: claim, error } = await supabaseAdmin.from("generation_jobs").update({ status: "processing", stage: "submitting", provider_endpoint: providerEndpoint(category) }).eq("id", jobId).eq("engine", "direct").in("stage", ["queued", "ready", "classifying"]).is("provider_task_id", null).select("id").maybeSingle();
    if (error) throw new Error("Couldn't prepare generation.");
    if (!claim) throw new WorkflowNonRetryableError("This request is already being submitted.");
    // The provider has no documented creation idempotency. Never repeat an uncertain POST.
    let submitted: Awaited<ReturnType<typeof submitPhoto>>;
    try { submitted = await submitPhoto(category, images.person, images.item, fit, generationConfig().perfectKey); }
    catch (cause) {
      throw new WorkflowNonRetryableError(cause instanceof GenerationProviderError ? cause.message : "Submission status is uncertain. Check Perfect Corp before trying again.");
    }
    await updateJob(jobId, { provider_task_id: submitted.taskId, provider_endpoint: submitted.endpoint, stage: "polling" });
    return submitted;
  });
  for (let attempt = 0; attempt < 60; attempt++) {
    await context.sleep(`wait-${attempt}`, 10);
    const result = await context.run(`poll-${attempt}`, () => safeStep(() => pollPhoto(task.endpoint, task.taskId, generationConfig().perfectKey)));
    if (!result.finished || !result.url) continue;
    await context.run("save-generated-image", () => safeStep(async () => {
      const job = await loadJob(jobId);
      if (job.status === "completed") return;
      await updateJob(jobId, { stage: "saving" });
      const url = trustedMediaUrl(result.url ?? "", "result", generationConfig().supabaseOrigin);
      const { bytes, mime } = await boundedImage(url, 20 * 1024 * 1024);
      const path = resultObjectPath(job.user_id, jobId, mime);
      const storage = supabaseAdmin.storage.from("generated-looks");
      const { error } = await storage.upload(path, bytes, { contentType: mime, upsert: true });
      if (error) throw new Error("Couldn't save the generated photo.");
      const image = storage.getPublicUrl(path).data.publicUrl;
      await updateJob(jobId, { status: "completed", stage: "completed", result_storage_path: path, result_image_url: image, error_message: null });
    }));
    return;
  }
  throw new WorkflowNonRetryableError("This try-on took too long. Your request was not submitted again.");
}

export async function handlePhotoWorkflow(request: Request) {
  let config: ReturnType<typeof generationConfig>;
  try { config = generationConfig(); } catch { return Response.json({ error: "Generation setup incomplete" }, { status: 503 }); }
  const signature = request.headers.get("upstash-signature");
  if (!signature) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.clone().text();
  if (body.length > 512000) return new Response("Request too large", { status: 413 });
  const receiver = new Receiver({ currentSigningKey: config.currentSigningKey, nextSigningKey: config.nextSigningKey, devMode: false });
  try {
    if (!await receiver.verify({ signature, body, url: config.url })) return new Response("Unauthorized", { status: 401 });
  } catch { return new Response("Unauthorized", { status: 401 }); }
  const handler = serve(runPhotoWorkflow, {
    url: config.url, receiver, qstashClient: new QStashClient({ token: config.token, devMode: false }), disableTelemetry: true,
    initialPayloadParser: (payload) => generationPayloadSchema.parse(JSON.parse(payload)),
    failureFunction: async ({ context, failStatus }) => {
      const parsed = generationPayloadSchema.safeParse(context.requestPayload);
      if (!parsed.success) return;
      // Do not store Upstash's raw failure response; it can contain signed URLs.
      await updateJob(parsed.data.jobId, { status: "failed", stage: "failed", error_message: `Photo generation stopped (${failStatus}). Please check the request or try another photo.` });
    },
  });
  return handler.POST({ request });
}