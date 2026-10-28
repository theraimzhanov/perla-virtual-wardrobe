import type { DiscoverProduct } from "./data";

export type ProductMode = "discover" | "personal";
// Five one-tap business questions: fit, occasion, color, price perception, purchase intent.
export const photoQuestions = [
  { id: "fit", text: "How does the silhouette look on you?", options: ["Just right", "Too fitted", "Too loose"] },
  { id: "occasion", text: "Where would you wear this?", options: ["Everyday", "Work & dinner", "Special event"] },
  { id: "color", text: "What do you think of this colorway?", options: ["Perfect as is", "Prefer neutrals", "Want bolder"] },
  { id: "price", text: "How does it feel for its quality?", options: ["Luxury value", "Fair price", "Feels overpriced"] },
  { id: "intent", text: "Would you add this to your wardrobe?", options: ["Definitely", "If on sale", "Pass for now"] },
] as const;
export const videoQuestions = [
  { id: "movement", text: "Does it move naturally?", options: ["Yes", "Mostly", "Not yet"] },
  { id: "confidence", text: "Can you picture yourself in it?", options: ["Definitely", "Maybe", "No"] },
  { id: "favorite", text: "Is this a new favorite?", options: ["Love it", "Like it", "Not for me"] },
] as const;

export function addSelection(ids: string[], id: string) {
  return ids.includes(id) ? ids : [...ids, id];
}

export function generationIssue(photo: string | null, products: DiscoverProduct[]): "photo" | "product" | null {
  if (!photo) return "photo";
  if (!products.length) return "product";
  return null;
}

export const personalPhotoQuestions = [
  { id: "category", text: "What kind of piece is this?", options: ["Clothes", "Bag", "Hat", "Shoes"] },
  { id: "where", text: "Where did you find it?", options: ["Own closet", "Internet", "Store"] },
  { id: "fit", text: "How does the silhouette look on you?", options: ["Just right", "Too fitted", "Too loose"] },
  { id: "occasion", text: "Where would you wear this?", options: ["Everyday", "Work & dinner", "Special event"] },
  { id: "similar", text: "Want similar new pieces on PERLA?", options: ["Yes", "Maybe", "No"] },
] as const;
export const personalVideoQuestions = [
  { id: "movement", text: "Does it move naturally?", options: ["Yes", "Mostly", "Not yet"] },
  { id: "similar", text: "Want similar new pieces on PERLA?", options: ["Yes", "Maybe", "No"] },
  { id: "occasion", text: "Where would you wear it?", options: ["Everyday", "Work", "Evening"] },
] as const;

export function questionsFor(kind: "photo" | "video", mode: ProductMode) {
  if (mode === "personal") return kind === "photo" ? personalPhotoQuestions : personalVideoQuestions;
  return kind === "photo" ? photoQuestions : videoQuestions;
}

/** Looks made from a locally uploaded product are labelled "Own upload" when shared. */
export function lookSource(mode: ProductMode): "discover" | "own" {
  return mode === "personal" ? "own" : "discover";
}

export function showFeedback(_mode: ProductMode) {
  return true;
}