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
- Keep generation preview-only with bundled sample photo and video assets until real generation is explicitly requested; uploaded images must never silently be sent to third parties.
- Keep product-selection and feedback rules in a pure module with focused tests so changes to the intended flow remain verifiable.
- Keep Discover rankings and shared-look filtering in pure rules, and store media, product/source metadata and likes in TryOnProvider so community and profile cards remain consistent with Try-On results.
- Derive the homepage shared-look statistic from the same sharedVirtualLooks rule as Brand Insights so it updates with the shared session.
- Keep homepage footer navigation in SiteFooter and link only to existing pages or email contact, avoiding invented legal policies or unavailable services.
