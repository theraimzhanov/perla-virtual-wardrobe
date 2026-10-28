import { describe, expect, it } from "vitest";
import { discoverCategories, discoverProducts } from "@/components/web/data";
import { addSelection, generationIssue, lookSource, photoQuestions, questionsFor, showFeedback, videoQuestions } from "@/components/web/try-on-rules";

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
    expect(photoQuestions).toHaveLength(5);
  });
  it("has exactly three video questions for discovered products", () => {
    expect(videoQuestions).toHaveLength(3);
  });
  it("asks three photo and three video questions for own uploads", () => {
    expect(showFeedback("personal")).toBe(true);
    expect(questionsFor("photo", "personal")).toHaveLength(5);
    expect(questionsFor("video", "personal")).toHaveLength(3);
  });
  it("labels looks from own uploads as own, not Discover", () => {
    expect(lookSource("personal")).toBe("own");
    expect(lookSource("discover")).toBe("discover");
  });
});