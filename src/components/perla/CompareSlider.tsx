import { useEffect, useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";
import { PerlaMascot } from "./PerlaMascot";
import { cn } from "@/lib/utils";

// Before/after slider. With `mascot`, the PERLA logo is the handle; `autoPlay` sweeps between images until touched.
export function CompareSlider({ before, after, mascot = false, autoPlay = false, delayedMascot = false }: { before: string; after: string; mascot?: boolean; autoPlay?: boolean; delayedMascot?: boolean }) {
  const [pos, setPos] = useState(50);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  useEffect(() => {
    if (!autoPlay || touched) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // Holds on the original, glides to the generated look, then back.
      const t = ((now - start) / 7000) % 1;
      const wave = t < 0.15 ? 0 : t < 0.5 ? (t - 0.15) / 0.35 : t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35;
      const eased = wave * wave * (3 - 2 * wave);
      setPos(95 - eased * 90);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoPlay, touched]);
  return (
    <div
      ref={ref}
      className="relative aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-2xl bg-muted"
      onPointerDown={(e) => {
        setTouched(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
    >
      <img src={after} alt="After" className="h-full w-full object-contain" draggable={false} />
      <div className="absolute inset-0 overflow-hidden bg-muted" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="Before" className="h-full w-full object-contain" draggable={false} />
      </div>
      <span className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-[11px] uppercase tracking-widest">Before</span>
      <span className="absolute right-3 top-3 rounded-full bg-primary/85 px-3 py-1 text-[11px] uppercase tracking-widest text-primary-foreground">After</span>
      <div className="absolute inset-y-0 w-px bg-background" style={{ left: `${pos}%` }}>
        {mascot ? (
          <div className={cn("absolute top-1/2 left-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-soft", delayedMascot && "perla-mascot-appear")}>
            <PerlaMascot mood={touched ? "happy" : "look"} className="h-11 w-11" />
            <ChevronsLeftRight className="absolute -bottom-5 h-4 w-4 text-gold" />
          </div>
        ) : (
          <div className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background shadow-soft">
            <ChevronsLeftRight className="h-4 w-4 text-gold" />
          </div>
        )}
      </div>
    </div>
  );
}
