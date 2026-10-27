DROP TRIGGER IF EXISTS virtualtryon ON public.generation_jobs;
CREATE TRIGGER virtualtryon
AFTER INSERT ON public.generation_jobs
FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
  'https://raimzhanov.app.n8n.cloud/webhook/virtual-try-on',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);