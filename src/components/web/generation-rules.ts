import { z } from "zod";

export const generationRequestSchema = z.object({
  expectedOwner: z.string().uuid(),
  requestId: z.string().uuid(),
  accessoryFit: z.enum(["female", "male"]).nullable().default(null),
});
export const generationPayloadSchema = z.object({ jobId: z.string().uuid() });
export const classificationSchema = z.object({ category: z.enum(["Clothes", "Bag", "Hat", "Shoes", "unsupported"]) });
export type AccessoryFit = "female" | "male";
export type PhotoJob = {
  id: string;
  status: string;
  stage: string;
  image: string | null;
  error: string | null;
  title: string;
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

export function photoJobPhase(job: Pick<PhotoJob, "status" | "image">): "loading" | "done" | "failed" {
  if (job.status === "failed") return "failed";
  if (job.status === "completed") return job.image ? "done" : "failed";
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