REVOKE ALL ON public.user_photos, public.try_on_products, public.try_on_inputs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.user_photos, public.try_on_products TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.try_on_inputs TO authenticated;
GRANT ALL ON public.user_photos, public.try_on_products, public.try_on_inputs TO service_role;