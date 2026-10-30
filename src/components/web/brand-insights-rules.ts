import type { DiscoverProduct } from "./data";
import { byLikes, type Look } from "./looks";

export type ProductSignals = { id: string; tryOns: number; likes: number };
export type RankedProduct = DiscoverProduct & ProductSignals;
export type ProductRanking = "tryOns" | "likes";

export function rankDiscoverProducts(products: DiscoverProduct[], signals: ProductSignals[], metric: ProductRanking): RankedProduct[] {
  return products
    .filter((product) => product.source === "discover")
    .map((product) => {
      const signal = signals.find((item) => item.id === product.id);
      return { ...product, tryOns: signal?.tryOns ?? 0, likes: signal?.likes ?? 0 };
    })
    .sort((a, b) => b[metric] - a[metric] || b[metric === "tryOns" ? "likes" : "tryOns"] - a[metric === "tryOns" ? "likes" : "tryOns"]);
}

export function sharedVirtualLooks(looks: Look[]) {
  return byLikes(looks.filter((look) => look.shared && look.kind === "photo"));
}

// A saved job counts once for the image it made (photo jobs) or the video it made
// (video jobs); a video's stored source photo is not a second generated image.
export type GeneratedMediaRow = { kind: string; result_image_url: string | null; result_video_url: string | null };
export type GeneratedMedia = { images: number; videos: number; total: number };

export function tallyGeneratedMedia(rows: GeneratedMediaRow[]): GeneratedMedia {
  const images = rows.filter((row) => row.kind === "photo" && Boolean(row.result_image_url)).length;
  const videos = rows.filter((row) => row.kind === "video" && Boolean(row.result_video_url)).length;
  return { images, videos, total: images + videos };
}
