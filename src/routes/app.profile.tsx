import { createFileRoute } from "@tanstack/react-router";
import { history } from "@/components/perla/data";
import { PageHeader, Panel, Stat } from "@/components/web/ui";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — PERLA" },
      { name: "description", content: "Your PERLA profile, style preferences and history." },
      { property: "og:title", content: "Profile — PERLA" },
      { property: "og:description", content: "Your style profile on PERLA." },
    ],
  }),
  component: Profile,
});

const prefs = ["Minimal", "Neutrals", "Tailored", "Silk", "Parisian"];

function Profile() {
  return (
    <div>
      <PageHeader eyebrow="Member since Oct 2026" title="Nursultan" accent="Raimzhanov" />
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-1">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gold-gradient font-serif text-3xl text-primary-foreground">NR</div>
          <p className="mt-4 font-serif text-2xl">Style DNA</p>
          <p className="text-sm text-muted-foreground">Quiet luxury with a Parisian edge.</p>
          <div className="mt-4 flex flex-wrap gap-2">{prefs.map((p) => <span key={p} className="rounded-full bg-secondary px-3 py-1 text-sm">{p}</span>)}</div>
          <div className="mt-6 space-y-4 text-sm">
            {["Email me new drops", "Share feedback with brands", "Private profile"].map((s, i) => (
              <label key={s} className="flex items-center justify-between">{s}<Switch defaultChecked={i < 2} /></label>
            ))}
          </div>
        </Panel>
        <div className="space-y-6 xl:col-span-2">
          <div className="grid gap-6 sm:grid-cols-3">
            <Stat label="Try-ons" value="48" /><Stat label="Studio shots" value="17" /><Stat label="Saved pieces" value="36" />
          </div>
          <Panel>
            <h2 className="mb-4 font-serif text-2xl">Recent looks</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {history.map((h) => (
                <div key={h.id}><img src={h.image} alt={h.title} className="aspect-[3/4] w-full rounded-2xl object-cover" /><p className="mt-2 font-serif text-lg">{h.title}</p><p className="text-xs text-muted-foreground">{h.date} · {h.credits} credit</p></div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
