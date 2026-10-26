import { wardrobe } from "@/components/perla/data";

export const products = wardrobe.map((g, i) => ({
  ...g,
  price: [128, 165, 340, 210, 145, 290][i] ?? 150,
  trend: [92, 81, 88, 95, 74, 86][i] ?? 80,
  intent: [64, 48, 71, 83, 39, 57][i] ?? 50,
  tryOns: [1842, 1210, 2390, 3105, 980, 1544][i] ?? 1000,
}));

export const demandSeries = [
  { day: "Mon", tryOns: 820, intent: 410 },
  { day: "Tue", tryOns: 940, intent: 470 },
  { day: "Wed", tryOns: 1120, intent: 590 },
  { day: "Thu", tryOns: 1060, intent: 560 },
  { day: "Fri", tryOns: 1390, intent: 760 },
  { day: "Sat", tryOns: 1710, intent: 930 },
  { day: "Sun", tryOns: 1580, intent: 880 },
];

export const priceBands = [
  { band: "$80", buyers: 34 },
  { band: "$120", buyers: 58 },
  { band: "$160", buyers: 71 },
  { band: "$200", buyers: 46 },
  { band: "$240", buyers: 22 },
];

export const audience = [
  { name: "18–24", value: 28 },
  { name: "25–34", value: 41 },
  { name: "35–44", value: 21 },
  { name: "45+", value: 10 },
];

export const insights = [
  "Satin Slip Dress has the highest buy-intent this week (83%) — consider a restock before Friday.",
  "Shoppers would pay $160 on average for the Silk Blouse, 24% above current price tier.",
  "Neutral tones drive 3.1× more try-ons than prints among 25–34 year olds.",
];

export const studioGallery = [
  { title: "Riviera Morning", style: "Riviera", likes: 214 },
  { title: "Paris After Rain", style: "Editorial", likes: 189 },
  { title: "Runway Noir", style: "Runway", likes: 302 },
  { title: "Golden Terrace", style: "Golden Hour", likes: 156 },
];

export const transactions = [
  { id: "t1", label: "Signature pack", date: "Oct 24, 2026", amount: "+50", price: "$19.99" },
  { id: "t2", label: "Virtual try-on · Silk Blouse", date: "Oct 24, 2026", amount: "−1", price: "" },
  { id: "t3", label: "AI Studio · Riviera", date: "Oct 22, 2026", amount: "−2", price: "" },
  { id: "t4", label: "Welcome bonus", date: "Oct 20, 2026", amount: "+5", price: "Free" },
];
