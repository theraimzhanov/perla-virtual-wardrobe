import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="perla-eyebrow text-[11px] font-medium uppercase text-gold">{children}</p>;
}

export function PageHeader({ eyebrow, title, accent, desc, action }: { eyebrow: string; title: string; accent?: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="perla-page-header mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-foreground md:text-5xl">
          {title} {accent && <em className="text-gold">{accent}</em>}
        </h1>
        {desc && <p className="mt-2 max-w-xl text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("perla-panel", className)}>{children}</div>;
}

export function Stat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="perla-stat">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-4xl text-foreground">{value}</p>
      {delta && <p className="mt-1 text-sm text-gold">{delta}</p>}
    </div>
  );
}

export function Pill({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      aria-pressed={Boolean(active)}
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card hover:bg-secondary",
      )}
    >
      {children}
    </Button>
  );
}

export function GoldButton({ children, onClick, className, disabled }: { children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
  return (
    <Button variant="runway" onClick={onClick} disabled={disabled} className={cn("h-auto rounded-full px-6 py-3", className)}>
      {children}
    </Button>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  return <span className="rounded-full bg-gold-gradient px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">Trend {score}</span>;
}
