ALTER TABLE public.generation_jobs ADD COLUMN IF NOT EXISTS parent_job_id uuid REFERENCES public.generation_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.try_on_products ADD COLUMN IF NOT EXISTS wardrobe_hidden boolean NOT NULL DEFAULT false;

CREATE TABLE public.look_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.generation_jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);
GRANT SELECT, INSERT, DELETE ON public.look_likes TO authenticated;
GRANT ALL ON public.look_likes TO service_role;
ALTER TABLE public.look_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their likes" ON public.look_likes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX look_likes_job_idx ON public.look_likes(job_id);

CREATE TABLE public.feedback_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.generation_jobs(id) ON DELETE CASCADE,
  kind text NOT NULL,
  question_id text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, question_id)
);
GRANT SELECT ON public.feedback_answers TO authenticated;
GRANT ALL ON public.feedback_answers TO service_role;
ALTER TABLE public.feedback_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their feedback" ON public.feedback_answers FOR SELECT TO authenticated USING (user_id = auth.uid());

DELETE FROM public.generation_jobs WHERE id IS NOT NULL;