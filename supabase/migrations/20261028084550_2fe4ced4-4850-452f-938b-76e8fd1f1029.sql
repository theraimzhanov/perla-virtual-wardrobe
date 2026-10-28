ALTER TABLE public.generation_jobs ADD COLUMN IF NOT EXISTS studio_scene text, ADD COLUMN IF NOT EXISTS studio_prompt text;

CREATE OR REPLACE FUNCTION public.touch_generation_job() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.status NOT IN ('pending','processing','completed','failed') THEN RAISE EXCEPTION 'invalid status'; END IF;
 IF NEW.kind NOT IN ('photo','video') THEN RAISE EXCEPTION 'invalid kind'; END IF;
 IF NEW.engine NOT IN ('n8n','direct') THEN RAISE EXCEPTION 'invalid generation engine'; END IF;
 IF NEW.source NOT IN ('discover','own','internet','store') THEN RAISE EXCEPTION 'invalid source'; END IF;
 IF NEW.accessory_fit IS NOT NULL AND NEW.accessory_fit NOT IN ('female','male') THEN RAISE EXCEPTION 'invalid accessory fit'; END IF;
 IF NEW.stage NOT IN ('queued','classifying','ready','submitting','rendering','polling','saving','completed','failed') THEN RAISE EXCEPTION 'invalid stage'; END IF;
 IF NEW.studio_prompt IS NOT NULL AND length(NEW.studio_prompt) > 2000 THEN RAISE EXCEPTION 'studio prompt too long'; END IF;
 IF NEW.engine = 'direct' AND NEW.status = 'completed' AND (NEW.result_image_url IS NULL OR NEW.result_storage_path IS NULL) THEN RAISE EXCEPTION 'Completed direct jobs require stored output'; END IF;
 IF TG_OP = 'UPDATE' THEN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.engine IS DISTINCT FROM OLD.engine OR NEW.request_id IS DISTINCT FROM OLD.request_id OR NEW.photo_id IS DISTINCT FROM OLD.photo_id OR NEW.product_id IS DISTINCT FROM OLD.product_id OR NEW.studio_scene IS DISTINCT FROM OLD.studio_scene THEN RAISE EXCEPTION 'Generation identity cannot change'; END IF;
  IF OLD.status IN ('completed','failed') AND NEW.status <> OLD.status THEN RAISE EXCEPTION 'Finished jobs cannot restart'; END IF;
 END IF;
 NEW.updated_at = now(); RETURN NEW;
END; $$;