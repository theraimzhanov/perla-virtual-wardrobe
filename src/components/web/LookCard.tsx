import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Send, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTryOn } from "./TryOnContext";
import { DownloadButton } from "./DownloadButton";
import { sourceLabel, type Look } from "./looks";

export function LookCard({ look, showShare = false, showDelete = false, showDownload = false, showTry = false }: { look: Look; showShare?: boolean; showDelete?: boolean; showDownload?: boolean; showTry?: boolean }) {
  const { likeLook, shareLook, unshareLook, deleteLook, tryLook } = useTryOn();
  const navigate = useNavigate();
  const [trying, setTrying] = useState(false);
  const tryIt = async () => {
    if (trying) return;
    setTrying(true);
    try { if (await tryLook(look)) await navigate({ to: "/app/try-on" }); } finally { setTrying(false); }
  };
  const label = sourceLabel(look.source);
  const productName = look.product ?? look.title;
  return (
    <article aria-label={look.title} className="min-w-0 overflow-hidden rounded-lg bg-card shadow-card">
      <div className="relative aspect-[3/4] bg-secondary">
        <img src={look.image} alt={`${productName} virtual try-on by ${look.author}`} loading="lazy" width={768} height={1024} className="h-full w-full object-cover" />
        {showTry && <Button type="button" variant="secondary" size="icon" onClick={() => { void tryIt(); }} disabled={trying} aria-label={`Try on ${productName}`} title="Try this piece on" className="absolute left-3 top-3 h-10 w-10 rounded-full bg-background/90 text-gold shadow-card disabled:opacity-60"><Star className={cn("h-5 w-5 fill-current", trying && "motion-safe:animate-spin")} /></Button>}
      </div>
      <div className="p-3 sm:p-4">
        {look.brand && <p className="mb-1 break-words text-[10px] uppercase text-muted-foreground">{look.brand}</p>}
        {label && <p className="mb-2 break-words text-[10px] uppercase text-gold">{label}</p>}
        <p className="break-words font-serif text-xl leading-tight">{productName}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 break-words text-xs text-muted-foreground">{look.author}</p>
          <Button size="sm" variant="ghost" aria-pressed={look.liked} aria-label={`Like ${look.title}`} title={`Like ${look.title}`} onClick={() => likeLook(look.id)} className={cn("shrink-0 rounded-full px-2 tabular-nums", look.liked && "text-gold")}><Heart className={look.liked ? "fill-current" : ""} />{look.likes.toLocaleString()}</Button>
          {showShare && !look.shared && <Button size="icon" variant="outline" aria-label={`Share ${look.title} to Brand Insights`} title="Share to Brand Insights" onClick={() => shareLook(look.id)} className="h-8 w-8 shrink-0 rounded-full"><Send /></Button>}
          {showShare && look.shared && <Button size="icon" variant="default" aria-label={`Unshare ${look.title} from Brand Insights`} title="Shared — click to remove from Brand Insights" onClick={() => unshareLook(look.id)} className="h-8 w-8 shrink-0 rounded-full"><Send /></Button>}
          {showDownload && <DownloadButton url={look.image} title={look.title} label={`Download ${look.title}`} className="h-8 w-8 shrink-0" />}
          {showDelete && <Button size="icon" variant="outline" aria-label={`Delete ${look.title}`} title="Delete" onClick={() => deleteLook(look.id)} className="h-8 w-8 shrink-0 rounded-full text-destructive"><Trash2 /></Button>}
        </div>
      </div>
    </article>
  );
}
