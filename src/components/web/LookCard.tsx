import { Film, Heart, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTryOn } from "./TryOnContext";
import type { Look } from "./looks";

export function LookCard({ look, showShare = false }: { look: Look; showShare?: boolean }) {
  const { likeLook, shareLook } = useTryOn();
  return (
    <article aria-label={look.title} className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="relative">
        <img src={look.image} alt={look.title} loading="lazy" className="aspect-[3/4] w-full object-cover" />
        {look.kind === "video" && <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[10px] uppercase"><Film className="h-3 w-3" />Video</span>}
        {look.shared && <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] uppercase text-primary-foreground">Shared</span>}
      </div>
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1"><p className="truncate font-serif text-lg leading-tight">{look.title}</p><p className="text-[11px] text-muted-foreground">{look.author}</p></div>
        <Button size="sm" variant="ghost" aria-pressed={look.liked} aria-label={`Like ${look.title}`} onClick={() => likeLook(look.id)} className={cn("rounded-full px-2", look.liked && "text-gold")}><Heart className={look.liked ? "fill-current" : ""} />{look.likes}</Button>
        {showShare && !look.shared && <Button size="icon" variant="outline" aria-label={`Share ${look.title} to Brand Insights`} title="Share to Brand Insights" onClick={() => { shareLook(look.id); toast.success("Shared to Brand Insights"); }} className="h-8 w-8 rounded-full"><Send /></Button>}
      </div>
    </article>
  );
}
