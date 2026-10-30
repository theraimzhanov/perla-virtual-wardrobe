import logo from "@/assets/perla-emblem.svg.asset.json";
import { cn } from "@/lib/utils";

// The PERLA shell as a small animated character with shared motion styles.
export function PerlaMascot({ mood = "jump", className }: { mood?: "jump" | "look" | "happy" | "glide"; className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-block", className)}>
      <img src={logo.url} alt="" draggable={false} className={cn("h-full w-full select-none object-contain drop-shadow-md", `perla-mascot-${mood}`)} />
      {mood === "happy" && <span className="perla-mascot-sparkle absolute -right-1 -top-1 text-gold">✦</span>}
    </span>
  );
}
