import type { DiscoverProduct } from "./data";

export type ProductMode = "discover" | "personal";
export const photoQuestions = [
  { id: "style", text: "Does this style feel like you?", options: ["Yes", "Maybe", "Not quite"] },
  { id: "fit", text: "How does the fit look?", options: ["Just right", "Too loose", "Too fitted"] },
  { id: "wear", text: "Would you wear this?", options: ["Definitely", "Maybe", "No"] },
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
  { id: "wear", text: "Would you wear this look?", options: ["Definitely", "Maybe", "No"] },
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