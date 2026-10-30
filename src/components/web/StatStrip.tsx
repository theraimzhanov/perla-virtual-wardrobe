import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function Count({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const previous = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); previous.current = value; return; }
    const from = previous.current;
    previous.current = value;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 900, 1);
      setShown(Math.round(from + (value - from) * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="tabular-nums" aria-label={value.toLocaleString()}>{shown.toLocaleString()}</span>;
}

export function StatStrip({ items, className }: { items: { value: number; label: string; icon: LucideIcon }[]; className?: string }) {
  const tones = ["text-stat-mint", "text-stat-rose", "text-stat-sky", "text-gold"];
  return <div className={cn("perla-stat-strip grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>{items.map(({ value, label, icon: Icon }, i) => <div key={label} className="stat-reveal min-w-0"><Icon className={cn("mb-3 h-5 w-5", tones[i % tones.length])} /><p className="font-serif text-4xl leading-none"><Count value={value} /></p><p className="mt-2 text-[10px] uppercase leading-relaxed text-muted-foreground">{label}</p></div>)}</div>;
}