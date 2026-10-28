import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createVideoJob, getPhotoJob } from "./generation.functions";
import { photoJobPhase, type PhotoJob } from "./generation-rules";

// Real video generation for a finished, saved try-on photo. Resets whenever the photo changes.
export function useVideoGeneration(userId: string | null, photoJobId: string | null) {
  const create = useServerFn(createVideoJob);
  const read = useServerFn(getPhotoJob);
  const [job, setJob] = useState<PhotoJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const request = useRef<string | null>(null);
  const version = useRef(0);

  useEffect(() => { version.current++; request.current = null; setJob(null); setStarting(false); setStartError(null); }, [photoJobId, userId]);

  const refresh = useCallback(async (id: string, epoch: number) => {
    try { const row = await read({ data: { id } }); if (epoch === version.current) setJob(row); }
    catch { /* keep waiting; the saved request is still processing */ }
  }, [read]);

  useEffect(() => {
    if (!job || ["completed", "failed"].includes(job.status)) return;
    const id = job.id; const epoch = version.current;
    const channel = supabase.channel(`video-${id}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "generation_jobs", filter: `id=eq.${id}` }, () => { void refresh(id, epoch); })
      .subscribe();
    const timer = setInterval(() => { void refresh(id, epoch); }, 6000);
    return () => { clearInterval(timer); void supabase.removeChannel(channel); };
  }, [job?.id, job?.status, refresh]);

  const start = async () => {
    if (!userId || !photoJobId || starting) return;
    const epoch = ++version.current;
    setStarting(true); setStartError(null); setJob(null);
    request.current ??= crypto.randomUUID();
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user || data.user.id !== userId) throw new Error("Your account changed. Please sign in again.");
      const created = await create({ data: { expectedOwner: data.user.id, requestId: request.current, photoJobId } });
      const row = await read({ data: { id: created.jobId } });
      if (epoch === version.current) setJob(row);
    } catch (cause) {
      if (epoch === version.current) { const message = cause instanceof Error ? cause.message : "Couldn't start your video."; setStartError(message); toast.error(message); }
    } finally { if (epoch === version.current) setStarting(false); }
  };
  useEffect(() => { if (job && ["completed", "failed"].includes(job.status)) request.current = null; }, [job?.status]);
  const phase = starting ? "loading" : job ? photoJobPhase(job) : "idle";
  return { job, phase, start, video: job?.video ?? null, error: startError ?? (job?.status === "failed" ? job.error ?? "Video generation failed." : null) };
}
