DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
REVOKE SELECT ON public.products FROM anon;
CREATE POLICY "Signed-in users view products" ON public.products FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);