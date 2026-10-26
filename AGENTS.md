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

- Keep cross-screen photo uploads and product selection in the shared TryOnProvider so Discover, web Try-On, and mobile Try-On use the same session state.
- Reuse TryOnExperience for both web and mobile so upload validation, photo/video stages and personal-product feedback rules cannot diverge.
- Keep generation preview-only with bundled sample photo and video assets until real generation is explicitly requested; uploaded images must never silently be sent to third parties.
- Keep product-selection and feedback rules in a pure module with focused tests so changes to the intended flow remain verifiable.
- Keep Discover rankings and shared-look filtering in pure rules, and store media, product/source metadata and likes in TryOnProvider so community and profile cards remain consistent with Try-On results.
- Derive the homepage shared-look statistic from the same sharedVirtualLooks rule as Brand Insights so it updates with the shared session.
- Keep homepage footer navigation in SiteFooter and link only to existing pages or email contact, avoiding invented legal policies or unavailable services.
