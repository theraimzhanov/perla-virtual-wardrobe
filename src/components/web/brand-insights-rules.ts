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
  return byLikes(looks.filter((look) => look.shared && (look.kind === "photo" || Boolean(look.video?.webm || look.video?.mp4))));
}