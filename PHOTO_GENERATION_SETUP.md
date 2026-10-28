# PERLA photo generation: activation checklist

## What is implemented

Authenticated app server functions create owner-bound jobs in the existing external Supabase. Upstash Workflow runs short, resumable steps: category detection for unknown uploads, a category-specific Perfect Corp request, delayed status checks, result download, and Storage persistence. Only the saved Supabase image is displayed.

The new processor is **not activated**. New requests continue using the existing n8n workflow until publication and verification. This prevents a callback that is not yet online from breaking generation.

## Credentials

The secure form saved `PERFECT_CORP_API_KEY`, `GEMINI_API_KEY`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, and `QSTASH_NEXT_SIGNING_KEY`.

- Perfect Corp: https://yce.perfectcorp.com/ai-api → API Console → API key. Enable the relevant APIs and maintain sufficient provider credits.
- Gemini: https://aistudio.google.com → Get API key. Use a project with Gemini API enabled and available quota.
- Upstash: https://console.upstash.com → QStash → copy the Token and both Signing keys into Lovable's secure form. Provider delivery/AI usage may incur charges.
- Keep these as server secrets, never in browser code or committed environment files.

## Next actions

1. Publish PERLA when ready. The configured callback is `https://perla-virtual-wardrobe.lovable.app/api/public/generation/photo`.
2. Open that address. It must return `{"processor":"perla-photo-v1"}`. If it does not, do not activate direct processing. Its public GET contains no user data; all processing POSTs require valid QStash signatures.
3. Ask Lovable to activate and test direct photo generation. It can save `PERLA_DIRECT_GENERATION_ENABLED=true` securely and verify the published callback before changing the flag. Existing n8n jobs keep their engine and can finish without being submitted to the new processor.
4. Sign in, upload a real user photo, choose one Discover clothing product, and click Generate try-on. Check Upstash Workflow runs and the owner's `generation_jobs` row. Confirm `engine=direct`, a provider task ID, and eventually `status=completed` with a permanent Storage path.
5. Reload Try-On and Profile. Confirm the same real image restores. Test like, share/unshare and delete. Then test a locally uploaded product and confirm Gemini sets the job category without changing the uploaded product's stored `unknown` category.
6. Bags and hats require an explicit Women's/Men's accessory-fit selection because the provider requires that parameter; the app does not infer it from personal photos. Shoes use `shoes-transfer`.
7. Once direct processing is verified, keep n8n for analytics or disable its generation workflow when no legacy jobs remain. Do not delete it before verification.

No Supabase Dashboard setting changes are required now. Existing Storage and Realtime are reused.

## Safety and current limits

- Unique account/request keys deduplicate delivery retries. A persisted submission claim prevents automatic duplicate provider POSTs. A provider response that is lost before a durable checkpoint remains inherently uncertain because Perfect Corp does not document creation idempotency; the app stops rather than risking another charge.
- Safe status/download steps retry; durable sleeps do not hold a hosting request open. There is no permanent database polling schedule.
- Results currently use the existing public `generated-looks` bucket. Unshare/delete removes app visibility, not public access to a previously copied image URL; stronger private media and retention policies need a separate change.
- Sharing persists for the owner and the current shared app session; a cross-account community feed and per-user community likes are not added in this phase.
- Video and AI Studio still produce sample previews. Their actual generation migration is not implemented here.
- Signed-in end-to-end testing is unavailable through the external Supabase session tools. No production activation or real direct-generation claim is made until the live signed-in flow has been tested.
- Existing Supabase warnings about executable security-definer functions and disabled leaked-password protection predate this migration.