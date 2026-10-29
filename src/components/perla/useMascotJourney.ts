import { useEffect, useState, type RefObject } from "react";

type Refs = {
  heroRef: RefObject<HTMLElement | null>;
  mascotRef: RefObject<HTMLImageElement | null>;
  eyebrowRef: RefObject<HTMLElement | null>;
  phraseRef: RefObject<HTMLElement | null>;
  sliderRef: RefObject<HTMLElement | null>;
};

// Measures the hero text and slider, then plays the mascot's drop → bounce → drop → leap path. Returns true once it lands.
export function useMascotJourney({ heroRef, mascotRef, eyebrowRef, phraseRef, sliderRef }: Refs) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const hero = heroRef.current, m = mascotRef.current, eb = eyebrowRef.current, ph = phraseRef.current, sl = sliderRef.current;
    if (!hero || !m || !eb || !ph || !sl || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !m.animate) {
      setDone(true);
      return;
    }
    const h = hero.getBoundingClientRect();
    const size = m.offsetWidth;
    const at = (r: DOMRect, fx: number) => ({ x: r.left - h.left + r.width * fx - size / 2, y: r.top - h.top - size + 6 });
    const e = at(eb.getBoundingClientRect(), 0.35);
    const phr = ph.getClientRects()[0] ?? ph.getBoundingClientRect();
    const p = at(phr, 0.5);
    const s = sl.getBoundingClientRect();
    const end = { x: s.left - h.left + s.width / 2 - size / 2, y: s.top - h.top + s.height / 2 - size / 2 };
    const start = { x: e.x - 20, y: -h.top - size }; // just below the header logo
    const f = (x: number, y: number, t: string, o = 1) => ({ transform: `translate(${x}px, ${y}px) ${t}`, opacity: o });
    const mid = (a: number, b: number, k = 0.5) => a + (b - a) * k;
    const frames: Keyframe[] = [
      { ...f(start.x, start.y, "scale(.6) rotate(-20deg)", 0), offset: 0 },
      { ...f(e.x, e.y, "scale(.9, 1.15)"), offset: 0.14, easing: "ease-out" },
      { ...f(e.x, e.y + 8, "scale(1.35, .65)"), offset: 0.18 },
      { ...f(e.x + 6, e.y - 45, "scale(.92, 1.1) rotate(8deg)"), offset: 0.27, easing: "ease-in" },
      { ...f(e.x + 10, e.y + 6, "scale(1.25, .75)"), offset: 0.34 },
      { ...f(e.x + 10, e.y, "scale(1)"), offset: 0.37 },
      { ...f(mid(e.x, p.x), Math.min(e.y, p.y) - 70, "rotate(-25deg) scale(.95, 1.08)"), offset: 0.46, easing: "ease-in" },
      { ...f(p.x, p.y + 8, "scale(1.35, .65)"), offset: 0.54 },
      { ...f(p.x - 4, p.y, "rotate(-10deg)"), offset: 0.58 },
      { ...f(p.x + 4, p.y, "rotate(10deg)"), offset: 0.62 },
      { ...f(p.x, p.y + 4, "scale(1.2, .8)"), offset: 0.66 },
      { ...f(mid(p.x, end.x), Math.min(p.y, end.y) - 120, "rotate(200deg) scale(1.05)"), offset: 0.8, easing: "ease-in" },
      { ...f(end.x, end.y, "rotate(360deg) scale(1.2, .8)"), offset: 0.94 },
      { ...f(end.x, end.y, "rotate(360deg) scale(1)", 0), offset: 1 },
    ];
    const anim = m.animate(frames, { duration: 5200, delay: 500, fill: "forwards", easing: "linear" });
    anim.onfinish = () => setDone(true);
    return () => anim.cancel();
  }, [heroRef, mascotRef, eyebrowRef, phraseRef, sliderRef]);
  return done;
}
