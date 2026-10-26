import { Sparkles, Film } from "lucide-react";
import { cn } from "@/lib/utils";

export function GenerationSkeleton({ kind = "photo", className }: { kind?: "photo" | "video" | "prepare"; className?: string }) {
  return (
    <div role="status" aria-label={kind === "video" ? "Generating video" : kind === "prepare" ? "Preparing try-on" : "Generating try-on"} className={cn("generation-skeleton relative grid aspect-[3/4] w-full place-items-center overflow-hidden rounded-2xl border bg-secondary", className)}>
      <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
        <div className="flex h-3/4 w-1/2 flex-col items-center gap-3 opacity-60">
          <div className="h-16 w-16 rounded-full bg-background/70" />
          <div className="h-2/5 w-4/5 rounded-t-[3rem] rounded-b-xl bg-background/70" />
          <div className="grid h-2/5 w-3/5 grid-cols-2 gap-3"><div className="rounded-b-2xl bg-background/70" /><div className="rounded-b-2xl bg-background/70" /></div>
        </div>
      </div>
      <div className="relative mt-auto w-full px-6 pb-8 text-center">
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-card shadow-card">{kind === "video" ? <Film className="h-5 w-5 text-gold" /> : <Sparkles className="h-5 w-5 text-gold" />}</div>
        <p className="font-serif text-2xl">{kind === "video" ? "Bringing your look to life…" : kind === "prepare" ? "Preparing your selection…" : "A little tailoring magic…"}</p>
        <div className="mx-auto mt-4 h-1 w-24 overflow-hidden rounded-full bg-background"><div className="generation-progress h-full w-1/2 rounded-full bg-gold" /></div>
      </div>
    </div>
  );
}