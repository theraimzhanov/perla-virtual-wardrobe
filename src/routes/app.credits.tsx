import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { creditPacks } from "@/components/perla/data";
import { transactions } from "@/components/web/data";
import { PageHeader, Panel, GoldButton } from "@/components/web/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/credits")({
  head: () => ({
    meta: [
      { title: "Credits & Plans — PERLA" },
      { name: "description", content: "Buy credits for virtual try-ons and AI Studio shoots." },
      { property: "og:title", content: "Credits & Plans — PERLA" },
      { property: "og:description", content: "Simple credit packs for every wardrobe." },
    ],
  }),
  component: Credits,
});

const perks = ["Try-on: 1 credit", "AI Studio: 2 credits", "HD downloads", "Credits never expire"];

function Credits() {
  return (
    <div>
      <PageHeader eyebrow="Balance · 12 credits" title="Choose your" accent="pack" />
      <div className="grid gap-6 md:grid-cols-3">
        {creditPacks.map((p) => (
          <Panel key={p.id} className={cn("flex flex-col", p.popular && "ring-2 ring-gold")}>
            {p.popular && <span className="mb-3 self-start rounded-full bg-gold-gradient px-3 py-1 text-[11px] uppercase tracking-widest text-primary-foreground">Most loved</span>}
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.label}</p>
            <p className="mt-2 font-serif text-5xl">{p.credits}<span className="text-lg text-muted-foreground"> credits</span></p>
            <p className="mt-1 text-2xl">{p.price}</p>
            <ul className="my-6 space-y-2 text-sm">{perks.map((k) => <li key={k} className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" />{k}</li>)}</ul>
            <GoldButton className="mt-auto" onClick={() => toast.success(`${p.credits} credits added (demo)`)}>Buy {p.label}</GoldButton>
          </Panel>
        ))}
      </div>
      <Panel className="mt-8">
        <h2 className="mb-4 font-serif text-2xl">History</h2>
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between border-t py-3 text-sm first:border-t-0">
            <div><p>{t.label}</p><p className="text-xs text-muted-foreground">{t.date}</p></div>
            <div className="text-right"><p className={cn("font-medium", t.amount.startsWith("+") && "text-gold")}>{t.amount}</p><p className="text-xs text-muted-foreground">{t.price}</p></div>
          </div>
        ))}
      </Panel>
    </div>
  );
}
