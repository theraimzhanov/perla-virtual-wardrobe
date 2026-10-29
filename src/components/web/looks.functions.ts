import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { uploadBucket } from "./upload-rules";
import { feedbackSchema } from "./generation-rules";
import { tallyGeneratedMedia, type GeneratedMedia } from "./brand-insights-rules";
import type { WeeklyReport } from "./weekly-insights-rules";

export type CommunityLook = { jobId: string; kind: "photo" | "video"; image: string; video: string | null; product: string; brand: string | null; author: string; source: "discover" | "own" | "internet" | "store"; likes: number; liked: boolean; mine: boolean };
export type ProductSignal = { id: string; tryOns: number; likes: number };
export type WardrobePiece = { id: string; name: string; brand: string | null; image: string };
export type { GeneratedMedia };

const source = (value: string) => (value === "own" || value === "internet" || value === "store" ? value : "discover");

// Shared looks are readable by every signed-in member; only safe display fields leave the server.
export const listCommunityLooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommunityLook[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: jobs, error } = await supabaseAdmin.from("generation_jobs").select("id,user_id,kind,result_image_url,result_video_url,product_name,brand_name,source").eq("shared", true).eq("status", "completed").is("deleted_at", null).order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error("Couldn't load community looks.");
    const rows = (jobs ?? []).filter((job) => job.result_image_url && (job.kind !== "video" || job.result_video_url));
    if (rows.length === 0) return [];
    const [likes, profiles] = await Promise.all([
      supabaseAdmin.from("look_likes").select("job_id,user_id").in("job_id", rows.map((row) => row.id)),
      supabaseAdmin.from("profiles").select("id,display_name,email").in("id", [...new Set(rows.map((row) => row.user_id))]),
    ]);
    const likeRows = likes.data ?? [];
    return rows.map((row) => {
      const profile = profiles.data?.find((item) => item.id === row.user_id);
      const author = profile?.display_name || profile?.email?.split("@")[0] || "PERLA member";
      return { jobId: row.id, kind: row.kind === "video" ? "video" : "photo", image: row.result_image_url!, video: row.result_video_url, product: row.product_name ?? "New look", brand: row.brand_name, author: row.user_id === context.userId ? "You" : author, source: source(row.source), likes: likeRows.filter((like) => like.job_id === row.id).length, liked: likeRows.some((like) => like.job_id === row.id && like.user_id === context.userId), mine: row.user_id === context.userId };
    });
  });

// A member may like their own looks or any shared look, once.
export const setLookLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid(), liked: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job } = await supabaseAdmin.from("generation_jobs").select("id,user_id,shared,status").eq("id", data.jobId).maybeSingle();
    if (!job || job.status !== "completed" || (job.user_id !== context.userId && !job.shared)) throw new Error("This look is unavailable.");
    const result = data.liked
      ? await supabaseAdmin.from("look_likes").upsert({ user_id: context.userId, job_id: data.jobId }, { onConflict: "user_id,job_id", ignoreDuplicates: true })
      : await supabaseAdmin.from("look_likes").delete().eq("user_id", context.userId).eq("job_id", data.jobId);
    if (result.error) throw new Error("Couldn't save your like.");
    const { count } = await supabaseAdmin.from("look_likes").select("job_id", { count: "exact", head: true }).eq("job_id", data.jobId);
    return { likes: count ?? 0, liked: data.liked };
  });

export const saveFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => feedbackSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: job, error } = await context.supabase.from("generation_jobs").select("id,kind,status").eq("id", data.jobId).eq("user_id", context.userId).single();
    if (error || !job || job.status !== "completed") throw new Error("This look is unavailable.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = Object.entries(data.answers).map(([question_id, answer]) => ({ user_id: context.userId, job_id: job.id, kind: job.kind, question_id, answer }));
    const { error: saveError } = await supabaseAdmin.from("feedback_answers").upsert(rows, { onConflict: "job_id,question_id" });
    if (saveError) throw new Error("Couldn't send your feedback. Please retry.");
    return { saved: true };
  });

// Try-on and like totals per Discover product, counted from saved photo try-ons across all members.
export const listProductSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<ProductSignal[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: jobs, error } = await supabaseAdmin.from("generation_jobs").select("id,product_id,parent_job_id,kind").eq("status", "completed").eq("source", "discover").is("deleted_at", null).limit(5000);
    if (error) throw new Error("Couldn't load product rankings.");
    const all = jobs ?? [];
    if (all.length === 0) return [];
    const productIds = [...new Set(all.map((job) => job.product_id).filter((id): id is string => Boolean(id)))];
    const [products, likes] = await Promise.all([
      supabaseAdmin.from("try_on_products").select("id,catalog_product_id").in("id", productIds),
      supabaseAdmin.from("look_likes").select("job_id").in("job_id", all.map((job) => job.id)),
    ]);
    const catalogOf = new Map((products.data ?? []).map((row) => [row.id, row.catalog_product_id]));
    const signals = new Map<string, ProductSignal>();
    for (const job of all) {
      const id = job.product_id ? catalogOf.get(job.product_id) : null;
      if (!id) continue;
      const signal = signals.get(id) ?? { id, tryOns: 0, likes: 0 };
      if (job.kind === "photo") signal.tryOns++;
      signal.likes += (likes.data ?? []).filter((like) => like.job_id === job.id).length;
      signals.set(id, signal);
    }
    return [...signals.values()];
  });

// Pieces the member has generated a finished try-on with, minus ones they removed.
export const listWardrobe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WardrobePiece[]> => {
    const { data: jobs } = await context.supabase.from("generation_jobs").select("product_id,created_at").eq("user_id", context.userId).eq("kind", "photo").eq("status", "completed").is("deleted_at", null).order("created_at", { ascending: false });
    const ids = [...new Set((jobs ?? []).map((job) => job.product_id).filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) return [];
    const { data: products, error } = await context.supabase.from("try_on_products").select("id,name,brand,image_url,storage_path,wardrobe_hidden").eq("user_id", context.userId).in("id", ids);
    if (error) throw new Error("Couldn't load your wardrobe.");
    const visible = (products ?? []).filter((product) => !product.wardrobe_hidden);
    const pieces = await Promise.all(visible.map(async (product) => {
      let image = product.image_url;
      if (product.storage_path) image = (await context.supabase.storage.from(uploadBucket).createSignedUrl(product.storage_path, 86400)).data?.signedUrl ?? null;
      return image ? { id: product.id, name: product.name, brand: product.brand, image } : null;
    }));
    return ids.map((id) => pieces.find((piece) => piece?.id === id)).filter((piece): piece is WardrobePiece => Boolean(piece));
  });

export const hideWardrobePiece = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("try_on_products").update({ wardrobe_hidden: true }).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error("Couldn't update your wardrobe.");
    return { saved: true };
  });

// Public landing-page total: how many finished images and videos members have created in total.
// Only aggregate counts leave this handler — never a row, name, or file.
export const countGeneratedMedia = createServerFn({ method: "POST" }).handler(async (): Promise<GeneratedMedia> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("generation_jobs")
    .select("kind,result_image_url,result_video_url")
    .eq("status", "completed")
    .is("deleted_at", null)
    .limit(5000);
  if (error) throw new Error("Couldn't load creation totals.");
  return tallyGeneratedMedia(data ?? []);
});

export type PlatformActivity = { tryOns: number; productsTried: number; likes: number; created: number };
// Only totals are public; source photos, product selections and member identities stay on the server.
export const countPlatformActivity = createServerFn({ method: "POST" }).handler(async (): Promise<PlatformActivity> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [images, videos, tryOns, likes] = await Promise.all([
    supabaseAdmin.from("generation_jobs").select("id", { count: "exact", head: true }).eq("kind", "photo").eq("status", "completed").is("deleted_at", null).not("result_image_url", "is", null),
    supabaseAdmin.from("generation_jobs").select("id", { count: "exact", head: true }).eq("kind", "video").eq("status", "completed").is("deleted_at", null).not("result_video_url", "is", null),
    supabaseAdmin.from("generation_jobs").select("id", { count: "exact", head: true }).eq("kind", "photo").eq("status", "completed").is("deleted_at", null).is("studio_scene", null).not("result_image_url", "is", null),
    supabaseAdmin.from("look_likes").select("job_id", { count: "exact", head: true }),
  ]);
  if ([images, videos, tryOns, likes].some((result) => result.error)) throw new Error("Couldn't load platform activity.");
  const productIds = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabaseAdmin.from("generation_jobs").select("product_id").eq("kind", "photo").eq("status", "completed").is("studio_scene", null).is("deleted_at", null).not("result_image_url", "is", null).order("id").range(offset, offset + 999);
    if (error) throw new Error("Couldn't load platform activity.");
    for (const row of data ?? []) if (row.product_id) productIds.add(row.product_id);
    if (!data || data.length < 1000) break;
  }
  const pieces = new Set<string>();
  const ids = [...productIds];
  for (let offset = 0; offset < ids.length; offset += 500) {
    const { data, error } = await supabaseAdmin.from("try_on_products").select("id,catalog_product_id").in("id", ids.slice(offset, offset + 500));
    if (error) throw new Error("Couldn't load platform activity.");
    for (const row of data ?? []) pieces.add(row.catalog_product_id ?? row.id);
  }
  return { tryOns: tryOns.count ?? 0, productsTried: pieces.size, likes: likes.count ?? 0, created: (images.count ?? 0) + (videos.count ?? 0) };
});

// Latest weekly report written by the n8n job (aggregate numbers + AI text only).
export const getWeeklyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WeeklyReport | null> => {
    const { data } = await context.supabase.from("insight_reports").select("payload").order("week_start", { ascending: false }).limit(1).maybeSingle();
    return (data?.payload as unknown as WeeklyReport) ?? null;
  });

export const getStyleDna = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("style_dna").select("headline,tags,updated_at").eq("user_id", context.userId).maybeSingle();
    return data ? { headline: data.headline, tags: data.tags, updatedAt: data.updated_at } : null;
  });
