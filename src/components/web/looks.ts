import after from "@/assets/model-after.jpg";
import dress from "@/assets/g-dress.jpg";
import trench from "@/assets/g-trench.jpg";
import blouse from "@/assets/g-blouse.jpg";

export type Look = {
  id: string;
  title: string;
  author: string;
  kind: "photo" | "video";
  image: string;
  likes: number;
  liked: boolean;
  shared: boolean;
  mine: boolean;
};

export const seedLooks: Look[] = [
  { id: "l1", title: "Parisian Neutrals", author: "You", kind: "photo", image: after, likes: 24, liked: false, shared: true, mine: true },
  { id: "l2", title: "Evening Slip", author: "You", kind: "video", image: dress, likes: 41, liked: false, shared: false, mine: true },
  { id: "l3", title: "Riviera Editorial", author: "You", kind: "photo", image: trench, likes: 9, liked: false, shared: false, mine: true },
  { id: "c1", title: "Silk Morning", author: "Amira K.", kind: "photo", image: blouse, likes: 312, liked: false, shared: true, mine: false },
  { id: "c2", title: "Rain in Paris", author: "Léa M.", kind: "video", image: trench, likes: 268, liked: false, shared: true, mine: false },
  { id: "c3", title: "After Dark", author: "Sofia R.", kind: "photo", image: dress, likes: 197, liked: false, shared: true, mine: false },
];

export const byLikes = (looks: Look[]) => [...looks].sort((a, b) => b.likes - a.likes);
export const toggleLike = (look: Look): Look => ({ ...look, liked: !look.liked, likes: look.likes + (look.liked ? -1 : 1) });
