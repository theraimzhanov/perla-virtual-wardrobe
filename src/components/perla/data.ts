import blouse from "@/assets/g-blouse.jpg";
import trousers from "@/assets/g-trousers.jpg";
import trench from "@/assets/g-trench.jpg";
import dress from "@/assets/g-dress.jpg";
import sneakers from "@/assets/g-sneakers.jpg";
import bag from "@/assets/g-bag.jpg";
import before from "@/assets/model-before.jpg";
import after from "@/assets/model-after.jpg";

export const modelBefore = before;
export const modelAfter = after;

export type Category = "Tops" | "Pants" | "Skirts" | "Dresses" | "Jackets" | "Shoes" | "Accessories";
export const categories: Category[] = ["Tops", "Pants", "Skirts", "Dresses", "Jackets", "Shoes", "Accessories"];

export type Garment = { id: string; name: string; brand: string; category: Category; image: string };

export const wardrobe: Garment[] = [
  { id: "g1", name: "Silk Blouse", brand: "Maison Ivoire", category: "Tops", image: blouse },
  { id: "g2", name: "Tailored Trousers", brand: "Atelier Camel", category: "Pants", image: trousers },
  { id: "g3", name: "Classic Trench", brand: "Rive Gauche", category: "Jackets", image: trench },
  { id: "g4", name: "Satin Slip Dress", brand: "Noir Studio", category: "Dresses", image: dress },
  { id: "g5", name: "Leather Sneakers", brand: "Blanc", category: "Shoes", image: sneakers },
  { id: "g6", name: "Gilded Top Handle", brand: "Or Paris", category: "Accessories", image: bag },
];

export const creditPacks = [
  { id: "p1", credits: 10, price: "$4.99", label: "Starter" },
  { id: "p2", credits: 50, price: "$19.99", label: "Signature", popular: true },
  { id: "p3", credits: 150, price: "$49.99", label: "Couture" },
];

export const CREDIT_COST = { tryOn: 1, studio: 2 };

export const studioStyles = ["Editorial", "Street", "Runway", "Golden Hour", "Studio White", "Riviera"];

export const history = [
  { id: "h1", title: "Parisian Neutrals", date: "Oct 21", image: after, credits: -1 },
  { id: "h2", title: "Evening Slip", date: "Oct 18", image: dress, credits: -1 },
  { id: "h3", title: "Riviera Editorial", date: "Oct 15", image: trench, credits: -2 },
];
