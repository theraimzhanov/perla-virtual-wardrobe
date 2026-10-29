import { PerlaMascot } from "@/components/perla/PerlaMascot";
import { cn } from "@/lib/utils";

// Soft moving gradient shown while a look is prepared or generated.
export function GenerationSkeleton({ kind = "photo", className }: { kind?: "photo" | "video" | "prepare"; className?: string }) {
  return (
    <div role="status" aria-label={kind === "video" ? "Generating video" : kind === "prepare" ? "Preparing try-on" : "Generating try-on"} className={cn("generation-gradient relative grid aspect-[3/4] w-full place-items-center overflow-hidden rounded-2xl", className)}>
      <div className="relative px-6 text-center">
        <PerlaMascot mood="happy" className="mx-auto mb-4 h-20 w-20" />
        <p className="font-serif text-2xl">{kind === "video" ? "Bringing your look to life…" : kind === "prepare" ? "Preparing your selection…" : "A little tailoring magic…"}</p>
        <p className="mt-2 text-xs text-muted-foreground">{kind === "video" ? "Videos can take a few minutes" : "This usually takes under a minute"}</p>
      </div>
    </div>
  );
}
