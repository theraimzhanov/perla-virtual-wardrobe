CREATE TABLE public.user_photos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 storage_path text NOT NULL UNIQUE,
 original_filename text NOT NULL,
 mime_type text NOT NULL,
 file_size bigint NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (id, user_id)
);
GRANT SELECT, INSERT ON public.user_photos TO authenticated;
GRANT ALL ON public.user_photos TO service_role;
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their photos" ON public.user_photos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners save their photos" ON public.user_photos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.try_on_products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 source text NOT NULL,
 catalog_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
 storage_path text UNIQUE,
 image_url text,
 name text NOT NULL,
 brand text,
 style text,
 category text NOT NULL DEFAULT 'unknown',
 original_filename text,
 mime_type text,
 file_size bigint,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (user_id, catalog_product_id),
 UNIQUE (id, user_id)
);
GRANT SELECT, INSERT ON public.try_on_products TO authenticated;
GRANT ALL ON public.try_on_products TO service_role;
ALTER TABLE public.try_on_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their product inputs" ON public.try_on_products FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners save their product inputs" ON public.try_on_products FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.try_on_inputs (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 photo_id uuid,
 personal_product_id uuid,
 product_mode text NOT NULL DEFAULT 'discover',
 selected_product_ids uuid[] NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (photo_id, user_id) REFERENCES public.user_photos(id, user_id),
 FOREIGN KEY (personal_product_id, user_id) REFERENCES public.try_on_products(id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.try_on_inputs TO authenticated;
GRANT ALL ON public.try_on_inputs TO service_role;
ALTER TABLE public.try_on_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their current inputs" ON public.try_on_inputs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners create their current inputs" ON public.try_on_inputs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners change their current inputs" ON public.try_on_inputs FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE FUNCTION public.validate_photo_input() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.storage_path NOT LIKE NEW.user_id::text || '/photos/%' OR length(NEW.storage_path) > 256
 OR length(NEW.original_filename) NOT BETWEEN 1 AND 255
 OR NEW.mime_type NOT IN ('image/jpeg','image/png','image/webp')
 OR NEW.file_size NOT BETWEEN 1 AND 10485760 THEN
 RAISE EXCEPTION 'Invalid photo metadata'; END IF;
 NEW.updated_at := now(); RETURN NEW;
END; $$;
CREATE TRIGGER validate_photo_input BEFORE INSERT OR UPDATE ON public.user_photos FOR EACH ROW EXECUTE FUNCTION public.validate_photo_input();

CREATE FUNCTION public.validate_product_input() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE catalog public.products%ROWTYPE;
BEGIN
 IF NEW.source = 'discover' THEN
  IF NEW.catalog_product_id IS NULL THEN RAISE EXCEPTION 'Catalog product required'; END IF;
  SELECT * INTO catalog FROM public.products WHERE id = NEW.catalog_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Catalog product not found'; END IF;
  NEW.name := catalog.name; NEW.brand := catalog.brand; NEW.style := catalog.style;
  NEW.category := catalog.category; NEW.image_url := catalog.image_url;
  NEW.storage_path := NULL; NEW.original_filename := NULL; NEW.mime_type := NULL; NEW.file_size := NULL;
 ELSIF NEW.source = 'upload' THEN
  IF NEW.catalog_product_id IS NOT NULL OR NEW.storage_path IS NULL
  OR NEW.storage_path NOT LIKE NEW.user_id::text || '/products/%' OR length(NEW.storage_path) > 256
  OR NEW.original_filename IS NULL OR length(NEW.original_filename) NOT BETWEEN 1 AND 255
  OR NEW.mime_type IS NULL OR NEW.mime_type NOT IN ('image/jpeg','image/png','image/webp')
  OR NEW.file_size IS NULL OR NEW.file_size NOT BETWEEN 1 AND 10485760 THEN
   RAISE EXCEPTION 'Invalid uploaded product metadata'; END IF;
  NEW.category := 'unknown'; NEW.brand := NULL; NEW.style := NULL; NEW.image_url := NULL;
 ELSE RAISE EXCEPTION 'Invalid product source'; END IF;
 IF length(NEW.name) NOT BETWEEN 1 AND 255 THEN RAISE EXCEPTION 'Invalid product name'; END IF;
 NEW.updated_at := now(); RETURN NEW;
END; $$;
CREATE TRIGGER validate_product_input BEFORE INSERT OR UPDATE ON public.try_on_products FOR EACH ROW EXECUTE FUNCTION public.validate_product_input();

CREATE FUNCTION public.validate_current_try_on_inputs() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.product_mode NOT IN ('discover','personal') THEN RAISE EXCEPTION 'Invalid product mode'; END IF;
 IF cardinality(NEW.selected_product_ids) > 100 OR EXISTS (
  SELECT 1 FROM unnest(NEW.selected_product_ids) requested(id)
  WHERE NOT EXISTS (SELECT 1 FROM public.try_on_products p WHERE p.id = requested.id AND p.user_id = NEW.user_id AND p.source = 'discover')
 ) THEN RAISE EXCEPTION 'Selection must contain your saved Discover products'; END IF;
 IF NEW.personal_product_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.try_on_products p WHERE p.id = NEW.personal_product_id AND p.user_id = NEW.user_id AND p.source = 'upload'
 ) THEN RAISE EXCEPTION 'Personal product must be your upload'; END IF;
 NEW.updated_at := now(); RETURN NEW;
END; $$;
CREATE TRIGGER validate_current_try_on_inputs BEFORE INSERT OR UPDATE ON public.try_on_inputs FOR EACH ROW EXECUTE FUNCTION public.validate_current_try_on_inputs();
CREATE INDEX user_photos_by_owner ON public.user_photos(user_id, created_at DESC);
CREATE INDEX try_on_products_by_owner ON public.try_on_products(user_id, created_at DESC);

CREATE POLICY "Owners read private try on uploads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners upload private try on images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text AND (storage.foldername(name))[2] IN ('photos','products') AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
CREATE POLICY "Owners remove their try on upload files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
