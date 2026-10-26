import { Film, Heart, Image, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTryOn } from "./TryOnContext";
import { sourceLabel, type Look } from "./looks";

export function LookCard({ look, showShare = false }: { look: Look; showShare?: boolean }) {
  const { likeLook, shareLook } = useTryOn();
  const label = sourceLabel(look.source);
  const productName = look.product ?? look.title;
  return (
    <article aria-label={look.title} className="min-w-0 overflow-hidden rounded-lg bg-card shadow-card">
      <div className="relative aspect-[3/4] bg-secondary">
        {look.kind === "video" && look.video ? (
          <video poster={look.image} controls playsInline loop preload="none" aria-label={`${productName} virtual try-on video by ${look.author}`} className="h-full w-full object-contain">
            {look.video.webm && <source src={look.video.webm} type="video/webm" />}
            {look.video.mp4 && <source src={look.video.mp4} type="video/mp4" />}
          </video>
        ) : <img src={look.image} alt={`${productName} virtual try-on by ${look.author}`} loading="lazy" width={768} height={1024} className="h-full w-full object-cover" />}
        <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[10px] uppercase">{look.kind === "video" ? <Film className="h-3 w-3" /> : <Image className="h-3 w-3" />}{look.kind === "video" ? "Video" : "Photo"}</span>
      </div>
      <div className="p-3 sm:p-4">
        {label && <p className="mb-2 break-words text-[10px] uppercase text-gold">{label}</p>}
        <p className="break-words font-serif text-xl leading-tight">{productName}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 break-words text-xs text-muted-foreground">{look.author}</p>
          <Button size="sm" variant="ghost" aria-pressed={look.liked} aria-label={`Like ${look.title}`} title={`Like ${look.title}`} onClick={() => likeLook(look.id)} className={cn("shrink-0 rounded-full px-2 tabular-nums", look.liked && "text-gold")}><Heart className={look.liked ? "fill-current" : ""} />{look.likes.toLocaleString()}</Button>
          {showShare && !look.shared && <Button size="icon" variant="outline" aria-label={`Share ${look.title} to Brand Insights`} title="Share to Brand Insights" onClick={() => { shareLook(look.id); toast.success("Shared to Brand Insights"); }} className="h-8 w-8 shrink-0 rounded-full"><Send /></Button>}
          {showShare && look.shared && <Send className="h-3.5 w-3.5 shrink-0 text-gold" aria-label="Shared to Brand Insights" />}
        </div>
      </div>
    </article>
  );
}
