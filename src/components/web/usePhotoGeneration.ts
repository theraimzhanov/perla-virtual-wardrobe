import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createGenerationJob, getPhotoJob } from "./generation.functions";
import { photoJobPhase, pickShownJob, type AccessoryFit, type PhotoJob } from "./generation-rules";

// The latest saved try-on stays on screen across navigation and selection changes
// until the member deletes it or generates a new one.
export function usePhotoGeneration(userId: string | null, _selectionKey: string, restored: PhotoJob | undefined) {
  const signedIn = Boolean(userId);
  const create = useServerFn(createGenerationJob);
  const read = useServerFn(getPhotoJob);
  const [job, setJob] = useState<PhotoJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const request = useRef<string | null>(null);
  const version = useRef(0);
  const lock = useRef(false);
  const dismissed = useRef<string | null>(null);

  useEffect(() => {
    version.current++;
    request.current = null;
    lock.current = false;
    dismissed.current = null;
    setJob(null); setStarting(false); setStartError(null);
  }, [userId]);

  useEffect(() => {
    if (lock.current || !restored || restored.id === dismissed.current) return;
    setJob((current) => pickShownJob(current, restored));
  }, [restored, userId]);

  const refresh = useCallback(async (id: string, epoch: number) => {
    try {
      const row = await read({ data: { id } });
      if (epoch === version.current) { setJob(row); setStartError(null); }
    } catch {
      if (epoch === version.current) setStartError("Couldn't check your photo yet. Your saved request is still processing.");
    }
  }, [read]);

  useEffect(() => {
    if (!job || !signedIn || ["completed", "failed"].includes(job.status)) return;
    const id = job.id;
    const epoch = version.current;
    let active = true;
    let checking = false;
    const check = async () => {
      if (checking || !active) return;
      checking = true;
      await refresh(id, epoch);
      checking = false;
    };
    const channel = supabase.channel(`photo-${id}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "generation_jobs", filter: `id=eq.${id}` }, () => { void check(); })
      .subscribe((status) => { if (status === "SUBSCRIBED") void check(); });
    // Read immediately and after subscribing: a fast completion cannot be missed.
    void check();
    const timer = setInterval(() => { void check(); }, 5000);
    return () => { active = false; clearInterval(timer); void supabase.removeChannel(channel); };
  }, [job?.id, job?.status, signedIn, refresh]);

  const start = async (fit: AccessoryFit | null) => {
    if (!signedIn || lock.current) return;
    lock.current = true;
    const epoch = ++version.current;
    setStarting(true); setStartError(null);
    request.current ??= crypto.randomUUID();
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user || data.user.id !== userId) throw new Error("Your account changed. Please sign in again.");
      const created = await create({ data: { expectedOwner: data.user.id, requestId: request.current, accessoryFit: fit } });
      if (epoch !== version.current) return;
      const row = await read({ data: { id: created.jobId } });
      if (epoch === version.current) setJob(row);
    } catch (cause) {
      if (epoch === version.current) {
        const message = cause instanceof Error ? cause.message : "Couldn't start your photo.";
        setStartError(message); toast.error(message);
      }
    } finally {
      if (epoch === version.current) { lock.current = false; setStarting(false); }
    }
  };
  const clear = () => { version.current++; dismissed.current = job?.id ?? null; setJob(null); setStartError(null); };
  useEffect(() => { if (job && ["completed", "failed"].includes(job.status)) request.current = null; }, [job?.status]);
  const phase = starting ? "loading" : job ? photoJobPhase(job) : "idle";
  return { job, phase, start, clear, error: startError ?? (job?.status === "failed" ? job.error ?? "Photo generation failed." : null), retryStatus: () => { if (job) void refresh(job.id, version.current); } };
}
