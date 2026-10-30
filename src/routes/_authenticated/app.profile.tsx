import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTryOn } from "@/components/web/TryOnContext";
import { LookCard } from "@/components/web/LookCard";
import { byLikes } from "@/components/web/looks";
import { PageHeader, Panel, Stat } from "@/components/web/ui";
import { Heart } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getStyleDna } from "@/components/web/looks.functions";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — PERLA" },
      { name: "description", content: "Your PERLA profile, style preferences and history." },
      { property: "og:title", content: "Profile — PERLA" },
      { property: "og:description", content: "Your style profile on PERLA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

type Account = { name: string; avatarUrl: string | null; email: string | null };

function Profile() {
  const { looks, triedProducts, removeTried, photoJobs, studioJobs } = useTryOn();
  const myLooks = byLikes(looks.filter((look) => look.mine));
  const tryOns = photoJobs.filter((job) => job.status === "completed").length;
  const studioShots = studioJobs.filter((job) => job.status === "completed").length;
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [account, setAccount] = useState<Account | null>(null);
  const loadDna = useServerFn(getStyleDna);
  const [dna, setDna] = useState<{ headline: string; tags: string[]; updatedAt: string } | null>(null);
  useEffect(() => { let alive = true; loadDna().then((d) => { if (alive) setDna(d); }).catch(() => {}); return () => { alive = false; }; }, [loadDna]);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!alive || !data.user) return;
      const meta = (data.user.user_metadata ?? {}) as Record<string, string | undefined>;
      let name = meta["full_name"] || meta["name"] || meta["display_name"] || data.user.email?.split("@")[0] || "You";
      let avatarUrl = meta["avatar_url"] ?? null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, email")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        name = profile.display_name || name;
        avatarUrl = profile.avatar_url || avatarUrl;
      }
      if (alive) setAccount({ name, avatarUrl, email: data.user.email ?? null });
    });
    return () => {
      alive = false;
    };
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    nav({ to: "/", replace: true });
  }

  const [firstName, ...restName] = (account?.name ?? "").split(" ");
  return (
    <div>
      <PageHeader eyebrow={account?.email ?? "Member"} title={firstName || "You"} accent={restName.join(" ")} />
      <div className="space-y-6">
        <Panel>
          {account?.avatarUrl ? <img src={account.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-full bg-gold-gradient font-serif text-3xl text-primary-foreground">{(account?.name ?? "P").split(/\s+/).map((part) => part[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "P"}</div>}
          <p className="mt-4 font-serif text-2xl">Style DNA</p>
          <p className="text-sm text-muted-foreground">{dna?.headline ?? "Your Style DNA is written from your try-ons every two weeks."}</p>
          {dna && <div className="mt-4 flex flex-wrap gap-2">{dna.tags.map((p) => <span key={p} className="rounded-full bg-secondary px-3 py-1 text-sm">{p}</span>)}</div>}
          {dna && <p className="mt-2 text-[11px] text-muted-foreground">Updated {new Date(dna.updatedAt).toLocaleDateString()}</p>}
          <div className="mt-6 space-y-4 text-sm">
            {["Email me new drops", "Share feedback with brands", "Private profile"].map((s, i) => (
              <label key={s} className="flex items-center justify-between">{s}<Switch defaultChecked={i < 2} /></label>
            ))}
          </div>
          <Button variant="outline" className="mt-6 w-full rounded-full" onClick={handleSignOut}>Sign out</Button>
        </Panel>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <Stat label="Try-ons" value={String(tryOns)} /><Stat label="Studio shots" value={String(studioShots)} /><Stat label="Saved pieces" value={String(triedProducts.length)} />
          </div>
          <Panel>
            <div className="mb-4 flex items-end justify-between gap-3"><h2 className="font-serif text-2xl">My looks</h2><span className="text-xs text-muted-foreground">Sorted by likes</span></div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {myLooks.map((look) => <LookCard key={look.id} look={look} showShare showDelete />)}
            </div>
            {myLooks.length === 0 && <p className="text-sm text-muted-foreground">Your virtual try-on and AI Studio photos will appear here.</p>}
          </Panel>
          <Panel>
            <div className="mb-4 flex items-end justify-between gap-3"><h2 className="font-serif text-2xl">Wardrobe</h2><span className="text-xs text-muted-foreground">Pieces you tried on</span></div>
            {triedProducts.length === 0 ? <p className="text-sm text-muted-foreground">Pieces you try on will appear here.</p> : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {triedProducts.map((p) => (
                  <article key={p.id} aria-label={p.name} className="relative overflow-hidden rounded-lg bg-card shadow-card">
                    <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" />
                    <button aria-label={`Remove ${p.name} from wardrobe`} title="Remove from wardrobe" onClick={() => removeTried(p.id)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-gold"><Heart className="h-4 w-4 fill-current" /></button>
                    <div className="p-3">{p.brand && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.brand}</p>}<p className="font-serif text-lg leading-tight">{p.name}</p></div>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
