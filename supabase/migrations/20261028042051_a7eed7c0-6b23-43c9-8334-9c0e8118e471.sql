ALTER TABLE public.generation_jobs
 ADD COLUMN engine text NOT NULL DEFAULT 'n8n',
 ADD COLUMN request_id uuid,
 ADD COLUMN provider_task_id text,
 ADD COLUMN provider_endpoint text,
 ADD COLUMN stage text NOT NULL DEFAULT 'queued',
 ADD COLUMN source text NOT NULL DEFAULT 'discover',
 ADD COLUMN accessory_fit text,
 ADD COLUMN result_storage_path text,
 ADD COLUMN liked boolean NOT NULL DEFAULT false,
 ADD COLUMN shared boolean NOT NULL DEFAULT false,
 ADD COLUMN deleted_at timestamptz;
CREATE UNIQUE INDEX generation_jobs_request_unique ON public.generation_jobs(user_id, request_id) WHERE request_id IS NOT NULL;
CREATE UNIQUE INDEX generation_jobs_provider_task_unique ON public.generation_jobs(provider_task_id) WHERE provider_task_id IS NOT NULL;
CREATE INDEX generation_jobs_active_owner_idx ON public.generation_jobs(user_id, created_at DESC) WHERE deleted_at IS NULL;
DROP TRIGGER IF EXISTS virtualtryon ON public.generation_jobs;
CREATE TRIGGER virtualtryon AFTER INSERT ON public.generation_jobs FOR EACH ROW WHEN (NEW.engine = 'n8n') EXECUTE FUNCTION supabase_functions.http_request('https://raimzhanov.app.n8n.cloud/webhook/virtual-try-on', 'POST', '{"Content-type":"application/json"}', '{}', '5000');
DROP POLICY IF EXISTS "Owners create pending jobs" ON public.generation_jobs;
CREATE POLICY "Owners create legacy pending jobs" ON public.generation_jobs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND engine = 'n8n' AND status = 'pending' AND request_id IS NULL AND provider_task_id IS NULL AND provider_endpoint IS NULL AND result_image_url IS NULL AND result_video_url IS NULL AND result_storage_path IS NULL AND liked = false AND shared = false AND deleted_at IS NULL);
CREATE OR REPLACE FUNCTION public.touch_generation_job() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.status NOT IN ('pending','processing','completed','failed') THEN RAISE EXCEPTION 'invalid status'; END IF;
 IF NEW.kind NOT IN ('photo','video') THEN RAISE EXCEPTION 'invalid kind'; END IF;
 IF NEW.engine NOT IN ('n8n','direct') THEN RAISE EXCEPTION 'invalid generation engine'; END IF;
 IF NEW.source NOT IN ('discover','own','internet','store') THEN RAISE EXCEPTION 'invalid source'; END IF;
 IF NEW.accessory_fit IS NOT NULL AND NEW.accessory_fit NOT IN ('female','male') THEN RAISE EXCEPTION 'invalid accessory fit'; END IF;
 IF NEW.stage NOT IN ('queued','classifying','ready','submitting','polling','saving','completed','failed') THEN RAISE EXCEPTION 'invalid stage'; END IF;
 IF NEW.engine = 'direct' AND NEW.status = 'completed' AND (NEW.result_image_url IS NULL OR NEW.result_storage_path IS NULL) THEN RAISE EXCEPTION 'Completed direct jobs require stored output'; END IF;
 IF TG_OP = 'UPDATE' THEN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.engine IS DISTINCT FROM OLD.engine OR NEW.request_id IS DISTINCT FROM OLD.request_id OR NEW.photo_id IS DISTINCT FROM OLD.photo_id OR NEW.product_id IS DISTINCT FROM OLD.product_id THEN RAISE EXCEPTION 'Generation identity cannot change'; END IF;
  IF OLD.status IN ('completed','failed') AND NEW.status <> OLD.status THEN RAISE EXCEPTION 'Finished jobs cannot restart'; END IF;
 END IF;
 NEW.updated_at = now(); RETURN NEW;
END; $$;
GRANT ALL ON public.generation_jobs TO service_role;