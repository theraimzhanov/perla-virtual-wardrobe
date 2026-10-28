import { Sparkles, Film } from "lucide-react";
import { cn } from "@/lib/utils";

// Soft moving gradient shown while a look is prepared or generated.
export function GenerationSkeleton({ kind = "photo", className }: { kind?: "photo" | "video" | "prepare"; className?: string }) {
  return (
    <div role="status" aria-label={kind === "video" ? "Generating video" : kind === "prepare" ? "Preparing try-on" : "Generating try-on"} className={cn("generation-gradient relative grid aspect-[3/4] w-full place-items-center overflow-hidden rounded-2xl", className)}>
      <div className="relative px-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-background/80 shadow-card">{kind === "video" ? <Film className="h-5 w-5 text-gold" /> : <Sparkles className="h-5 w-5 text-gold" />}</div>
        <p className="font-serif text-2xl">{kind === "video" ? "Bringing your look to life…" : kind === "prepare" ? "Preparing your selection…" : "A little tailoring magic…"}</p>
        <p className="mt-2 text-xs text-muted-foreground">{kind === "video" ? "Videos can take a few minutes" : "This usually takes under a minute"}</p>
      </div>
    </div>
  );
}
