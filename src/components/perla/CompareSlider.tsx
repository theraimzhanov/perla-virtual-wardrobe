import { useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

export function CompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={ref}
      className="relative aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-2xl bg-muted"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
    >
      <img src={after} alt="After" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="Before" className="h-full w-full object-cover" draggable={false} />
      </div>
      <span className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-[11px] uppercase tracking-widest">Before</span>
      <span className="absolute right-3 top-3 rounded-full bg-primary/85 px-3 py-1 text-[11px] uppercase tracking-widest text-primary-foreground">After</span>
      <div className="absolute inset-y-0 w-px bg-background" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background shadow-soft">
          <ChevronsLeftRight className="h-4 w-4 text-gold" />
        </div>
      </div>
    </div>
  );
}
