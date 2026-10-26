import { describe, expect, it } from "vitest";
import { discoverProducts } from "@/components/web/data";
import { rankDiscoverProducts, sharedVirtualLooks } from "@/components/web/brand-insights-rules";
import { seedLooks, sourceFromFeedback, toggleLike, type Look } from "@/components/web/looks";

describe("Brand Insights rules", () => {
  it("ranks only products from Discover, never own uploads", () => {
    const ownProduct = { ...discoverProducts[0], id: "personal", source: "personal" as const };
    const result = rankDiscoverProducts([...discoverProducts, ownProduct], [{ id: "personal", tryOns: 99999, likes: 99999 }], "tryOns");
    expect(result.map((product) => product.id)).toEqual(discoverProducts.map((product) => product.id));
    expect(result.every((product) => product.source === "discover")).toBe(true);
  });
  it("orders Discover products by try-ons", () => {
    const signals = [{ id: "g1", tryOns: 12, likes: 90 }, { id: "g2", tryOns: 24, likes: 10 }];
    expect(rankDiscoverProducts(discoverProducts, signals, "tryOns").slice(0, 2).map((product) => [product.id, product.tryOns])).toEqual([["g2", 24], ["g1", 12]]);
  });
  it("orders Discover products by likes", () => {
    const signals = [{ id: "g1", tryOns: 12, likes: 90 }, { id: "g2", tryOns: 24, likes: 10 }];
    expect(rankDiscoverProducts(discoverProducts, signals, "likes").slice(0, 2).map((product) => [product.id, product.likes])).toEqual([["g1", 90], ["g2", 10]]);
  });
  it("shows only explicitly shared photos and playable videos in the community", () => {
    const base = seedLooks[0];
    if (!base) throw new Error("Missing sample look");
    const looks: Look[] = [
      { ...base, id: "photo", shared: true, kind: "photo", likes: 4 },
      { ...base, id: "private", shared: false, likes: 100 },
      { ...base, id: "video", shared: true, kind: "video", video: { webm: "sample.webm" }, likes: 8 },
      { ...base, id: "no-video", shared: true, kind: "video", video: undefined, likes: 50 },
    ];
    expect(sharedVirtualLooks(looks).map((look) => look.id)).toEqual(["video", "photo"]);
  });
  it("includes shared own and internet products without treating them as Discover", () => {
    const base = seedLooks[0];
    if (!base) throw new Error("Missing sample look");
    const looks: Look[] = [{ ...base, id: "own", source: "own", shared: true }, { ...base, id: "internet", source: "internet", shared: true }];
    expect(sharedVirtualLooks(looks).map((look) => look.source)).toEqual(["own", "internet"]);
  });
  it("uses the user's source answer rather than assuming internet origin", () => {
    expect(sourceFromFeedback("Internet")).toBe("internet");
    expect(sourceFromFeedback("Own closet")).toBe("own");
    expect(sourceFromFeedback("Store")).toBe("store");
    expect(sourceFromFeedback("unknown")).toBeUndefined();
  });
  it("adds one like and removes it when the user clicks again", () => {
    const look = seedLooks.find((item) => item.id === "c1");
    if (!look) throw new Error("Missing sample look");
    const liked = toggleLike(look);
    expect(liked.likes).toBe(313);
    expect(liked.liked).toBe(true);
    expect(toggleLike(liked).likes).toBe(312);
    expect(toggleLike(liked).liked).toBe(false);
  });
});