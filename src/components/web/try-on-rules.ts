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

export function showFeedback(mode: ProductMode) {
  return mode === "discover";
}