<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep signed-in app routes under src/routes/_authenticated (pathless auth gate, ssr: false) so the Supabase session is validated in one place; public pages (landing, /login, /mobile) stay top-level.
- Keep cross-screen photo uploads and product selection in TryOnProvider via the saved-input hook; persist private files in Supabase Storage and metadata/current selections through authenticated server functions so web/mobile restore the same owner-scoped inputs.
- Derive the provider identity from the root auth subscription and remount it on identity changes; attach the browser bearer through function middleware so private inputs never cross accounts.
- Store permanent storage paths, not signed URLs, in upload records; create renewable access links for display and commit inputs only after both storage and metadata saves succeed so upload failures cannot masquerade as saved photos.
- Reuse TryOnExperience for both web and mobile so upload validation, photo/video stages and personal-product feedback rules cannot diverge.
- Direct photo/video generation is app-managed: authenticated server functions save an owner-scoped job with a unique request ID, prepare and submit it on creation, and every owner status check advances it one claimed step (poll, then save) via generation-direct.server; this avoids public webhooks and long-held requests. Uncertain provider submissions are never repeated because Perfect Corp has no documented creation idempotency. Legacy n8n jobs alone keep their database webhook so migration cannot double-charge.
- Store photo/video results in Supabase Storage before completing the job; Try-On shows the newest saved photo (and its parent-linked video) until deleted or replaced. Deleting hard-removes the job, its child videos, stored files, likes and feedback; likes live in look_likes and answers in feedback_answers so community, rankings, Profile and wardrobe all read real data. Signed-in failures never become sample successes; AI Studio remains sample-only until migrated.
- Keep product-selection and feedback rules in a pure module with focused tests so changes to the intended flow remain verifiable.
- Keep Discover rankings and shared-look filtering in pure rules, and store media, product/source metadata and likes in TryOnProvider so community and profile cards remain consistent with Try-On results.
- Show the homepage creation statistic as the total of finished images and videos across all members, counted by a public aggregate server function that returns only counts, so the landing page never needs a session and reveals no per-user data.
- Keep homepage footer navigation in SiteFooter and link only to existing pages or email contact, avoiding invented legal policies or unavailable services.
- Server-side fetch never uses redirect "error" (Cloudflare Workers reject it before sending); use "manual" plus the isRedirect guard so provider calls fail clearly instead of looking uncertain.
- AI Studio creations are generation_jobs rows marked by studio_scene (built prompt in studio_prompt, no parent link) so they appear in Profile/collections but never in Try-On result slots; studio images render once through the AI gateway image-edit endpoint (stage "rendering", never repeated) and studio videos reuse the Perfect Corp video path with the enriched prompt. Prompt enrichment and scene defaults live in pure studio-rules with tests.
- Brand Insights weekly sections (feedback trends, fit risk, Shadow Wardrobe, AI insights) and Profile Style DNA come from a weekly n8n job: it GETs aggregate numbers from /api/public/insights/weekly (bearer PERLA_INSIGHTS_SECRET), asks Gemini for text only, and POSTs it back; the app recomputes all numbers itself so AI never invents figures.
