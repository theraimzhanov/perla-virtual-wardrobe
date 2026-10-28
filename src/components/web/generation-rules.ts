import { z } from "zod";

export const generationRequestSchema = z.object({
  expectedOwner: z.string().uuid(),
  requestId: z.string().uuid(),
  accessoryFit: z.enum(["female", "male"]).nullable().default(null),
});
export const videoRequestSchema = z.object({
  expectedOwner: z.string().uuid(),
  requestId: z.string().uuid(),
  photoJobId: z.string().uuid(),
});
const answerKey = z.enum(["style", "fit", "wear", "movement", "confidence", "favorite", "category", "where", "similar", "occasion"]);
// Exactly the three answers of one feedback card, tied to one saved look.
export const feedbackSchema = z.object({ jobId: z.string().uuid(), answers: z.record(answerKey, z.string().min(1).max(40)) })
  .refine((value) => Object.keys(value.answers).length === 3, "Answer all three questions.");
export const generationPayloadSchema = z.object({ jobId: z.string().uuid() });
export const classificationSchema = z.object({ category: z.enum(["Clothes", "Bag", "Hat", "Shoes", "unsupported"]) });
export type AccessoryFit = "female" | "male";
export const directGenerationEnabled = (value: string | undefined) => value === "true";
export type PhotoJob = {
  id: string;
  status: string;
  stage: string;
  kind: "photo" | "video";
  image: string | null;
  video: string | null;
  error: string | null;
  title: string;
  brand?: string | null;
  likes?: number;
  feedbackSent?: boolean;
  parentJobId?: string | null;
  createdAt?: string;
  source: "discover" | "own" | "internet" | "store";
  liked: boolean;
  shared: boolean;
  photoId: string | null;
  productId: string | null;
};

export function providerEndpoint(category: string) {
  switch (category.toLowerCase()) {
    case "clothes": return "cloth-v4";
    case "bag": return "bag";
    case "hat": return "hat";
    case "shoes": return "shoes-transfer";
    default: throw new Error("Choose a clothing, bag, hat or shoe product photo.");
  }
}

export function providerBody(category: string, person: string, item: string, fit: AccessoryFit | null) {
  const endpoint = providerEndpoint(category);
  const images = { src_file_url: person, ref_file_url: item };
  if (endpoint === "cloth-v4") return { ...images, garment_category: "auto", change_shoes: false, filter_multi_person: "normal" };
  if (endpoint === "bag" || endpoint === "hat") {
    if (!fit) throw new Error("Choose an accessory fit before generating this bag or hat.");
    return { ...images, gender: fit };
  }
  return images;
}

export function photoJobPhase(job: Pick<PhotoJob, "status" | "image"> & { kind?: "photo" | "video"; video?: string | null }): "loading" | "done" | "failed" {
  if (job.status === "failed") return "failed";
  if (job.status === "completed") return (job.kind === "video" ? job.video : job.image) ? "done" : "failed";
  return "loading";
}

export function resultObjectPath(owner: string, jobId: string, mime: string) {
  const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return `${owner}/tryon/${jobId}.${extension}`;
}

export function trustedMediaUrl(value: string, kind: "input" | "result", supabaseOrigin: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid image address.");
  if (kind === "input") {
    if (url.origin !== new URL(supabaseOrigin).origin || !url.pathname.startsWith("/storage/v1/object/")) throw new Error("Image must come from saved PERLA storage.");
  } else {
    const hosts = ["amazonaws.com", "makeupar.com", "perfectcorp.com", "cloudfront.net"];
    if (url.hostname !== "storage.googleapis.com" && !hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) throw new Error("Unexpected generated image address.");
  }
  return url.toString();
}
// App-managed processing: each status check advances a saved job by at most one safe step.
export type DirectJobState = { status: string; stage: string; kind: string; provider_task_id: string | null; created_at: string; updated_at: string };
export type DirectAction = "none" | "wait" | "submit" | "uncertain" | "poll" | "expired";
export const DIRECT_STALE_MS = 90_000;
export const directLimitMs = (kind: string) => (kind === "video" ? 30 : 10) * 60_000;

export function nextDirectAction(job: DirectJobState, now: number): DirectAction {
  if (["completed", "failed"].includes(job.status)) return "none";
  const stale = now - Date.parse(job.updated_at) > DIRECT_STALE_MS;
  if (!job.provider_task_id) {
    // A submission that never recorded its task ID is never repeated: the provider has no idempotency.
    if (job.stage === "submitting") return stale ? "uncertain" : "wait";
    if (job.stage === "classifying") return stale ? "submit" : "wait";
    return "submit";
  }
  if (now - Date.parse(job.created_at) > directLimitMs(job.kind)) return "expired";
  if (job.stage === "saving" && !stale) return "wait";
  return "poll";
}

const finished = (status: string) => status === "completed" || status === "failed";
// Which saved job the Try-On screen shows: a newer local job wins, and a stale list row never rolls back a finished one.
export function pickShownJob<T extends Pick<PhotoJob, "id" | "status"> & { createdAt?: string }>(current: T | null, restored: T): T {
  if (!current) return restored;
  if (current.id !== restored.id) return Date.parse(current.createdAt ?? "") > Date.parse(restored.createdAt ?? "") ? current : restored;
  if (finished(current.status) && !finished(restored.status)) return current;
  return { ...current, ...restored };
}
