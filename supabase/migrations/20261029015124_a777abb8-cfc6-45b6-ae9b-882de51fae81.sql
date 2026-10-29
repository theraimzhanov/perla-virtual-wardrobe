CREATE TABLE public.brand_demo_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL UNIQUE,
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
 email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
 brand text NOT NULL CHECK (char_length(brand) BETWEEN 2 AND 120),
 message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 2000),
 consent boolean NOT NULL CHECK (consent = true),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.brand_demo_applications TO anon, authenticated;
GRANT ALL ON public.brand_demo_applications TO service_role;
ALTER TABLE public.brand_demo_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors submit consented demo applications" ON public.brand_demo_applications FOR INSERT TO anon, authenticated WITH CHECK (consent = true);
