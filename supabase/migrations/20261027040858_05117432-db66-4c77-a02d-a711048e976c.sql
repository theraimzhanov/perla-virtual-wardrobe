CREATE TABLE public.generation_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 kind text NOT NULL DEFAULT 'photo',
 status text NOT NULL DEFAULT 'pending',
 category text NOT NULL DEFAULT 'unknown',
 photo_id uuid,
 product_id uuid,
 person_image_url text NOT NULL,
 item_image_url text NOT NULL,
 product_name text,
 brand_name text,
 result_image_url text,
 result_video_url text,
 error_message text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.generation_jobs TO authenticated;
GRANT ALL ON public.generation_jobs TO service_role;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their jobs" ON public.generation_jobs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners create pending jobs" ON public.generation_jobs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND result_image_url IS NULL AND result_video_url IS NULL);
CREATE INDEX generation_jobs_user_idx ON public.generation_jobs (user_id, created_at DESC);
CREATE OR REPLACE FUNCTION public.touch_generation_job() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','processing','completed','failed') THEN RAISE EXCEPTION 'invalid status'; END IF;
  IF NEW.kind NOT IN ('photo','video') THEN RAISE EXCEPTION 'invalid kind'; END IF;
  NEW.updated_at = now();
  RETURN NEW;
END; $$;
CREATE TRIGGER generation_jobs_touch BEFORE INSERT OR UPDATE ON public.generation_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_generation_job();
ALTER TABLE public.generation_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_jobs;