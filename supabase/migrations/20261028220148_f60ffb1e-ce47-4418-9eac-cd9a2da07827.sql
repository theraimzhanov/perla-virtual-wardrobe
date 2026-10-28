CREATE TABLE public.insight_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL UNIQUE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.insight_reports TO authenticated;
GRANT ALL ON public.insight_reports TO service_role;
ALTER TABLE public.insight_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read weekly reports" ON public.insight_reports FOR SELECT TO authenticated USING (true);

CREATE TABLE public.style_dna (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.style_dna TO authenticated;
GRANT ALL ON public.style_dna TO service_role;
ALTER TABLE public.style_dna ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read their style DNA" ON public.style_dna FOR SELECT TO authenticated USING (user_id = auth.uid());