import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles } from "lucide-react";
import { audience, demandSeries, insights, priceBands, products } from "@/components/web/data";
import { PageHeader, Panel, Stat, Eyebrow } from "@/components/web/ui";

export const Route = createFileRoute("/app/insights")({
  head: () => ({
    meta: [
      { title: "Brand Insights — PERLA" },
      { name: "description", content: "Demand intelligence from virtual try-ons and shopper buy intent." },
      { property: "og:title", content: "Brand Insights — PERLA" },
      { property: "og:description", content: "See what shoppers want before you produce it." },
    ],
  }),
  component: Insights,
});

const pie = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function Insights() {
  return (
    <div>
      <PageHeader eyebrow="For brands · Maison Ivoire" title="Demand" accent="intelligence" desc="Real signals from try-ons and 'would buy' feedback across PERLA." />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Try-ons this week" value="8,620" delta="+18.4% vs last week" />
        <Stat label="Avg. buy intent" value="61%" delta="+6 pts" />
        <Stat label="Willing price" value="$172" delta="+$14 above list" />
        <Stat label="Saved to wardrobe" value="2,914" delta="+9.2%" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <h2 className="font-serif text-2xl">Try-ons vs buy intent</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={demandSeries}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip />
                <Area dataKey="tryOns" stroke="var(--chart-3)" fill="var(--chart-4)" fillOpacity={0.4} />
                <Area dataKey="intent" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <h2 className="font-serif text-2xl">Audience age</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart><Pie data={audience} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>{audience.map((a, i) => <Cell key={a.name} fill={pie[i]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">{audience.map((a, i) => <span key={a.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: pie[i] }} />{a.name} · {a.value}%</span>)}</div>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel>
          <h2 className="font-serif text-2xl">"Would buy at" price</h2>
          <div className="mt-4 h-60">
            <ResponsiveContainer>
              <BarChart data={priceBands}><XAxis dataKey="band" stroke="var(--muted-foreground)" fontSize={12} /><Tooltip /><Bar dataKey="buyers" fill="var(--chart-1)" radius={[10, 10, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel className="xl:col-span-2">
          <h2 className="mb-4 font-serif text-2xl">Top pieces</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground"><tr><th className="pb-3">Piece</th><th>Try-ons</th><th>Trend</th><th>Buy intent</th></tr></thead>
            <tbody>
              {[...products].sort((a, b) => b.intent - a.intent).map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="flex items-center gap-3 py-3"><img src={p.image} alt="" className="h-10 w-10 rounded-xl object-cover" />{p.name}</td>
                  <td>{p.tryOns.toLocaleString()}</td>
                  <td>{p.trend}</td>
                  <td><div className="flex items-center gap-2"><div className="h-1.5 w-24 rounded-full bg-muted"><div className="h-full rounded-full bg-gold" style={{ width: `${p.intent}%` }} /></div>{p.intent}%</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
      <Panel className="mt-6 bg-primary text-primary-foreground">
        <Eyebrow><span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> AI insights</span></Eyebrow>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">{insights.map((t) => <li key={t} className="rounded-2xl bg-primary-foreground/10 p-4 font-serif text-lg leading-snug">{t}</li>)}</ul>
      </Panel>
    </div>
  );
}
