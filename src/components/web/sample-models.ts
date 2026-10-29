import woman1 from "@/assets/sample-woman-1.jpg";
import woman2 from "@/assets/sample-woman-2.jpg";
import woman3 from "@/assets/sample-woman-3.jpg";
import man1 from "@/assets/sample-man-1.jpg";
import man2 from "@/assets/sample-man-2.jpg";
import man3 from "@/assets/sample-man-3.jpg";

export const sampleModels = [
  { id: "woman-1", label: "Woman 1", group: "Women", image: woman1 },
  { id: "woman-2", label: "Woman 2", group: "Women", image: woman2 },
  { id: "woman-3", label: "Woman 3", group: "Women", image: woman3 },
  { id: "man-1", label: "Man 1", group: "Men", image: man1 },
  { id: "man-2", label: "Man 2", group: "Men", image: man2 },
  { id: "man-3", label: "Man 3", group: "Men", image: man3 },
] as const;