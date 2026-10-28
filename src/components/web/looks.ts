import after from "@/assets/model-after.jpg";
import slipLook from "@/assets/community-slip.jpg";
import silkLook from "@/assets/community-silk.jpg";
import demoVideo from "@/assets/try-on-demo.mp4.asset.json";
import demoVideoWebm from "@/assets/try-on-demo.webm.asset.json";

export type LookSource = "discover" | "own" | "internet" | "store";
export const sampleLookVideo = { webm: demoVideoWebm.url, mp4: demoVideo.url };

export type Look = {
  id: string;
  jobId?: string;
  title: string;
  author: string;
  kind: "photo" | "video";
  image: string;
  likes: number;
  liked: boolean;
  shared: boolean;
  mine: boolean;
  source?: LookSource;
  product?: string;
  video?: { webm?: string; mp4?: string };
};

export const seedLooks: Look[] = [
  { id: "l1", title: "Parisian Neutrals", author: "You", kind: "photo", image: after, likes: 24, liked: false, shared: true, mine: true, source: "discover", product: "Classic Trench" },
  { id: "l2", title: "Trench in Motion", author: "You", kind: "video", image: after, video: sampleLookVideo, likes: 41, liked: false, shared: false, mine: true, source: "discover", product: "Classic Trench" },
  { id: "l3", title: "Riviera Editorial", author: "You", kind: "photo", image: silkLook, likes: 9, liked: false, shared: false, mine: true, source: "discover", product: "Silk Blouse" },
  { id: "c1", title: "Silk Morning", author: "Amira K.", kind: "photo", image: silkLook, likes: 312, liked: false, shared: true, mine: false, source: "discover", product: "Silk Blouse" },
  { id: "c2", title: "Rain in Paris", author: "Léa M.", kind: "video", image: after, video: sampleLookVideo, likes: 268, liked: false, shared: true, mine: false, source: "discover", product: "Classic Trench" },
  { id: "c3", title: "After Dark", author: "Sofia R.", kind: "photo", image: slipLook, likes: 197, liked: false, shared: true, mine: false, source: "discover", product: "Satin Slip Dress" },
  { id: "c4", title: "Vintage Find", author: "Mia T.", kind: "photo", image: silkLook, likes: 154, liked: false, shared: true, mine: false, source: "own", product: "Vintage Silk Shirt" },
  { id: "c5", title: "Evening Inspiration", author: "Noor A.", kind: "photo", image: slipLook, likes: 128, liked: false, shared: true, mine: false, source: "internet", product: "Black Satin Dress" },
];

export const byLikes = (looks: Look[]) => [...looks].sort((a, b) => b.likes - a.likes);
export const toggleLike = (look: Look): Look => ({ ...look, liked: !look.liked, likes: look.likes + (look.liked ? -1 : 1) });

export function sourceFromFeedback(answer: string): LookSource | undefined {
  if (answer === "Own closet") return "own";
  if (answer === "Internet") return "internet";
  if (answer === "Store") return "store";
  return undefined;
}

export function sourceLabel(source: LookSource | undefined) {
  if (source === "own") return "Own upload · outside Discover";
  if (source === "internet") return "Internet · outside Discover";
  if (source === "store") return "Store · outside Discover";
  return null;
}
