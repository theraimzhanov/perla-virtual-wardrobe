import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">{children}</p>;
}

export function PageHeader({ eyebrow, title, accent, desc, action }: { eyebrow: string; title: string; accent?: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
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
  return <div className={cn("rounded-[1.75rem] bg-card p-6 shadow-card", className)}>{children}</div>;
}

export function Stat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <Panel>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-4xl text-foreground">{value}</p>
      {delta && <p className="mt-1 text-sm text-gold">{delta}</p>}
    </Panel>
  );
}

export function Pill({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

export function GoldButton({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90", className)}>
      {children}
    </button>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  return <span className="rounded-full bg-gold-gradient px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">Trend {score}</span>;
}
