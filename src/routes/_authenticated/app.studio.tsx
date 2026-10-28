import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Film, Image as ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { jobLook, useTryOn } from "@/components/web/TryOnContext";
import { GenerationSkeleton } from "@/components/web/GenerationSkeleton";
import { LookCard } from "@/components/web/LookCard";
import { createStudioJob, getPhotoJob } from "@/components/web/generation.functions";
import { photoJobPhase } from "@/components/web/generation-rules";
import { DEFAULT_STUDIO_SCENE, STUDIO_PROMPT_LIMIT, studioSceneNames, type StudioScene } from "@/components/web/studio-rules";
import { PageHeader, Panel, Pill, GoldButton } from "@/components/web/ui";

export const Route = createFileRoute("/_authenticated/app/studio")({
  head: () => ({
    meta: [
      { title: "AI Studio — PERLA" },
      { name: "description", content: "Restyle your virtual try-on photos into new editorial images and videos." },
      { property: "og:title", content: "AI Studio — PERLA" },
      { property: "og:description", content: "Pick a try-on look, choose a scene and create new images and videos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

function Studio() {
  const { userId, photoJobs, studioJobs, refreshPhotoJobs } = useTryOn();
  const create = useServerFn(createStudioJob);
  const read = useServerFn(getPhotoJob);
  // Only finished try-on photos are base looks, each shown once.
  const bases = photoJobs.filter((job) => photoJobPhase(job) === "done");
  const [baseId, setBaseId] = useState<string | null>(null);
  const base = bases.find((job) => job.id === baseId) ?? bases[0];
  const [scene, setScene] = useState<StudioScene>(DEFAULT_STUDIO_SCENE);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<"photo" | "video">("photo");
  const [starting, setStarting] = useState(false);
  // Only the creation made in this visit is shown here; everything is kept in Profile collections.
  const [currentId, setCurrentId] = useState<string | null>(null);
  const lock = useRef(false);

  const pending = studioJobs.filter((job) => photoJobPhase(job) === "loading");
  const current = studioJobs.find((job) => job.id === currentId);

  // Each status check advances an unfinished creation one step (videos poll the provider).
  const pendingKey = pending.map((job) => job.id).join(",");
  useEffect(() => {
    if (!pendingKey) return;
    let checking = false;
    const check = async () => {
      if (checking) return; checking = true;
      try { await Promise.all(pendingKey.split(",").map((id) => read({ data: { id } }).catch(() => null))); await refreshPhotoJobs(); }
      finally { checking = false; }
    };
    const timer = setInterval(() => { void check(); }, 6000);
    return () => clearInterval(timer);
  }, [pendingKey, read, refreshPhotoJobs]);

  const generate = async () => {
    if (!base || !userId || lock.current) return;
    lock.current = true; setStarting(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user || data.user.id !== userId) throw new Error("Your account changed. Please sign in again.");
      const made = await create({ data: { expectedOwner: data.user.id, requestId: crypto.randomUUID(), baseJobId: base.id, kind: output, scene, prompt } });
      setCurrentId(made.jobId);
      await refreshPhotoJobs();
      toast.success(output === "photo" ? "New image ready — saved to your collections" : "Video started — it will appear here when ready");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Couldn't start your creation.");
      await refreshPhotoJobs();
    } finally { lock.current = false; setStarting(false); }
  };

  const busy = starting || pending.length > 0;

  return (
    <div>
      <PageHeader eyebrow="AI Studio" title="Your look," accent="reimagined" desc="Pick a try-on, choose a scene, add your idea if you like — or just press create. PERLA adds the styling details for you." />
      <Panel className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">1. Choose a try-on photo</h2>
        {bases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Create a virtual try-on first — <Link to="/app/try-on" className="text-gold underline">go to Try On</Link>.</p>
        ) : (
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {bases.map((job) => (
              <button key={job.id} onClick={() => setBaseId(job.id)} disabled={busy} aria-pressed={base?.id === job.id} className={cn("relative w-28 shrink-0 snap-start overflow-hidden rounded-lg border-2 text-left disabled:opacity-60", base?.id === job.id ? "border-gold" : "border-transparent")}>
                <img src={job.image ?? ""} alt={job.title} className="aspect-[3/4] w-full object-cover" />
                {base?.id === job.id && <span className="absolute right-1.5 top-1.5 rounded-full bg-gold p-1 text-primary-foreground"><Check className="h-3 w-3" /></span>}
                <p className="truncate p-1.5 text-xs">{job.title}</p>
              </button>
            ))}
          </div>
        )}
        <h2 className="mb-3 mt-6 font-serif text-2xl">2. Scene & idea <span className="text-sm text-muted-foreground">(optional)</span></h2>
        <div className="mb-3 flex flex-wrap gap-2">{studioSceneNames.map((s) => <Pill key={s} active={s === scene} onClick={() => setScene(s)}>{s}</Pill>)}</div>
        <textarea value={prompt} maxLength={STUDIO_PROMPT_LIMIT} onChange={(e) => setPrompt(e.target.value)} rows={2} placeholder={output === "photo" ? "e.g. in Paris, soft wind, film look" : "e.g. slow turn, smiling"} className="w-full resize-none rounded-2xl bg-secondary p-4 font-serif text-lg outline-none" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pill active={output === "photo"} onClick={() => setOutput("photo")}><ImageIcon className="mr-1 inline h-4 w-4" />Image</Pill>
          <Pill active={output === "video"} onClick={() => setOutput("video")}><Film className="mr-1 inline h-4 w-4" />Video</Pill>
          <GoldButton className="ml-auto" onClick={() => void generate()} disabled={!base || busy}><Sparkles className="h-4 w-4" /> {busy ? "Creating…" : `Create ${output === "photo" ? "image" : "video"}`}</GoldButton>
        </div>
      </Panel>
      {(starting || current) && (
        <section aria-label="Just created" className="mx-auto w-full max-w-xl">
          <h2 className="mb-4 font-serif text-3xl">Just created</h2>
          {current?.status === "failed" ? <p role="alert" className="text-sm text-destructive">This creation failed: {current.error ?? "please try again."}</p>
            : !current || photoJobPhase(current) === "loading" ? <GenerationSkeleton kind={current?.kind ?? output} />
            : <LookCard look={jobLook(current)} showShare showDelete showDownload />}
          <p className="mt-3 text-xs text-muted-foreground">All your creations are saved in Profile → My looks & videos.</p>
        </section>
      )}
    </div>
  );
}
