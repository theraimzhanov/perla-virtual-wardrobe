import { describe, expect, it } from "vitest";
import { discoverCategories, discoverProducts } from "@/components/web/data";
import { addSelection, generationIssue, photoQuestions, showFeedback, videoQuestions } from "@/components/web/try-on-rules";

describe("Discover and Try-On rules", () => {
  it("offers Clothes, Bag, Hat and Shoes", () => {
    expect(discoverCategories).toEqual(["Clothes", "Bag", "Hat", "Shoes"]);
    for (const category of discoverCategories) expect(discoverProducts.some((product) => product.category === category)).toBe(true);
  });
  it("adds the starred product to the selection", () => {
    expect(addSelection(["g1"], "g6")).toEqual(["g1", "g6"]);
  });
  it("does not duplicate a starred product", () => {
    expect(addSelection(["g1"], "g1")).toEqual(["g1"]);
  });
  it("requires a user photo before generation", () => {
    expect(generationIssue(null, discoverProducts.slice(0, 1))).toBe("photo");
    expect(generationIssue("user-photo", discoverProducts.slice(0, 1))).toBe(null);
  });
  it("requires at least one product before generation", () => {
    expect(generationIssue("user-photo", [])).toBe("product");
  });
  it("has exactly three photo questions for discovered products", () => {
    expect(showFeedback("discover")).toBe(true);
    expect(photoQuestions).toHaveLength(3);
  });
  it("has exactly three video questions for discovered products", () => {
    expect(videoQuestions).toHaveLength(3);
  });
  it("skips feedback for personally uploaded products", () => {
    expect(showFeedback("personal")).toBe(false);
  });
});