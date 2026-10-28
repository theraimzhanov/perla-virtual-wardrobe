import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createGenerationJob, getPhotoJob } from "./generation.functions";
import { photoJobPhase, type AccessoryFit, type PhotoJob } from "./generation-rules";

export function usePhotoGeneration(signedIn: boolean, selectionKey: string, restored: PhotoJob | undefined) {
  const create = useServerFn(createGenerationJob);
  const read = useServerFn(getPhotoJob);
  const [job, setJob] = useState<PhotoJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const request = useRef<string | null>(null);
  const version = useRef(0);
  const lock = useRef(false);
  const touched = useRef(false);

  useEffect(() => {
    version.current++;
    request.current = null;
    touched.current = false;
    lock.current = false;
    setJob(null); setStarting(false); setStartError(null);
  }, [selectionKey, signedIn]);

  useEffect(() => {
    if (!touched.current && restored) setJob(restored);
  }, [restored]);

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
    let checking = false;
    const check = async () => {
      if (checking) return;
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
    return () => { clearInterval(timer); void supabase.removeChannel(channel); };
  }, [job?.id, job?.status, signedIn, refresh]);

  const start = async (fit: AccessoryFit | null) => {
    if (!signedIn || lock.current) return;
    lock.current = true;
    touched.current = true;
    setStarting(true); setStartError(null); setJob(null);
    const epoch = version.current;
    request.current ??= crypto.randomUUID();
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Sign in to generate your photo.");
      const created = await create({ data: { expectedOwner: data.user.id, requestId: request.current, accessoryFit: fit } });
      if (epoch !== version.current) return;
      const row = await read({ data: { id: created.jobId } });
      if (epoch === version.current) { setJob(row); request.current = null; }
    } catch (cause) {
      if (epoch === version.current) {
        const message = cause instanceof Error ? cause.message : "Couldn't start your photo.";
        setStartError(message); toast.error(message);
      }
    } finally {
      if (epoch === version.current) { lock.current = false; setStarting(false); }
    }
  };
  const phase = starting ? "loading" : job ? photoJobPhase(job) : "idle";
  return { job, phase, start, error: startError ?? (job?.status === "failed" ? job.error ?? "Photo generation failed." : null), retryStatus: () => { if (job) void refresh(job.id, version.current); } };
}