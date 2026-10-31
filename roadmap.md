# Perla update

## Community product links
- [x] Preserve original Discover/private-product references on Try-On and AI Studio images, including owner cards; Studio preserves the product image separately from the restyled scene.
- [x] Exclude unlinked pictures from the community listing without deleting owners' saved creations. Database audit: all seven shared images already have intact product links; no backfill or deletion needed.
- [x] Browser-verified a real shared Studio star, selection after reload, and the demo account's own Studio star through temporary sharing (unshared afterward). Personal-product resolution, Studio inheritance and private-photo exclusion pass focused tests; no shared personal look was available for a real browser check. Left unpublished.

## Sunset Runway visual redesign
- [x] Apply colorful elegant semantic tokens, animated ribbon/section reveals, reduced-motion support and shared controls; no business logic, database or workflow changes.
- [x] Redesign homepage with generated fashion photography, account pages, Discover, Try-On, AI Studio scene picker, Profile and Insights; preserve existing photo-frame geometry.
- [x] Verify homepage at 1280/681/390px, real aggregate counts, account mode controls, demo form, sample picker, mobile scene/Profile navigation and dark account theme; all 125 tests pass and preview build OK. Left unpublished as requested.
- [x] Review signed-in screens with real saved looks — signed in through the app's own sign-in form as the supplied demo account; Try-On and AI Studio screens render real saved looks and their downloads save real files. Left unpublished as requested.

## October 31 AI Studio download fix
- [x] Make the download control save the picture instead of opening it in a new tab: read the storage bytes ahead of the click and hand over a same-origin file, with the phone share sheet as the touch path; AI Studio verified in preview (golden-hour-scarlet-slip-dress.png, 2.7 MB PNG, no new tab) and Try-On re-verified (perla-try-on.jpg, 171 KB JPEG); 129 tests pass and build OK.

## October 30 immediate and fortnightly reports
- [x] Send the real Google Sheets report (execution 75); fresh Gemini analysis saved three insights and five Style DNA profiles (execution 76), followed by a refreshed export.
- [x] Publish both active n8n schedules for alternate Fridays, next November 13, 2026 at 06:00/06:15 UTC; actual date gates tested at seven date boundaries and off-date runs stop before services.
- [x] Update Style DNA/Insights timing messages and documentation; 125 full-suite tests plus the added next-date boundary test pass; build OK.
- [x] Remove the "Next update: <date> · every two weeks" wording from Profile and Insights (user request); signed-in check as the supplied demo account confirms neither screen shows it, Profile keeps "Updated 10/30/2026", Insights shows no empty badge; 125 tests pass and build OK. Live wording awaits app publication.


## Weekly Google Sheets reporting
- [x] Add real brand/product, personal-upload, survey and Insights report tables with private customer identities excluded.
- [x] Connect Google Sheets and add the weekly n8n report in Perla Virtual Wardrobe without changing survey collection; Mondays 06:15 UTC.
- [x] Run a real report through n8n (execution 67 succeeded), read the spreadsheet back, and confirm 7 members, 14 completed try-ons, 43 survey answers and 8 products.
- [x] Publish reporting callback after permission; unauthorized calls return 401, unexpected bodies return 400, retired bearer tokens rejected; all 120 tests pass.
- [x] Verify fresh Gemini/Style DNA analysis — Gemini 3.1 Flash Lite succeeded after larger models returned temporary overload errors; three new insights and five profiles saved.

## October 30 notification and mascot presentation
- [x] Remove the separate Profile notification section and retain the top-bar bell.
- [x] Replace comparison-handle struggle effects with smooth, effortless push/pull motion and respect reduced motion.
- [x] Verify the homepage comparison at 1280px and 681px: full smooth sweep, manual dragging stops autoplay, reduced motion stays centered, no browser errors; 3 routing tests pass and build OK. Notification placement verified in source; signed-in Profile browser check unavailable for external unmanaged Supabase.

## October 29 requested updates
- [x] Set the labelled active-user demo baseline to 15 and redesign homepage/Insights statistics with subtle motion.
- [x] Replace Why PERLA with Demo and privately store applications; test entry saved, read back and removed. Owner reviews brand_demo_applications in Supabase; email notifications need verified sending.
- [x] Add colorful dress/hat/classic-dress examples and three male plus three female sample photos.
- [x] Create PRIVACY.md and connect Legal enquiries to the supplied GitHub HEAD policy path.
- [ ] Make the GitHub privacy notice publicly accessible — supplied repository returns 404 publicly; owner must check Git sync and repository visibility or provide a public policy destination.
- [x] Remove Accessory fit controls; retain required provider preset and category-specific endpoints. Known male sample photos use male preset; other inputs use fixed female provider default, not inferred identity.
- [x] Make Discover selections and successful local product uploads replace each other, with focused tests.
- [x] Verify public demo submission, desktop/mobile layouts and sample picker; all 108 tests pass and build OK.
- [ ] Signed-in Insights and private sample-upload/replacement end-to-end check — external unmanaged Supabase does not provide a test session.

## Public sitemap
- [x] Create and verify `public/sitemap.xml` for indexable public pages on studioperla.live, excluding private app pages, account recovery and API endpoints; local URL returns 200 XML, 4 focused tests pass, build OK.

## Saved Try-On results and real data
- [x] Single-submit guards on generate, video, like, share, delete and feedback.
- [x] Gradient loading state; delete for photo and video (removed from database and storage).
- [x] Keep the newest photo/video on Try-On across screens until deleted or replaced.
- [x] Save feedback answers; bigger Send feedback button.
- [x] Profile looks, wardrobe and stats from saved data; Brand Insights community and rankings from saved data.
- [x] Clear old generated looks and files.
- [ ] Signed-in check in the browser — automatic sign-in isn't available for this project; user to try it.


## App-managed generation (no webhooks)
- [x] Submit photo/video jobs inside the request and advance them on each status check; save results before completing.
- [ ] Run one signed-in photo + video on studioperla.live after publishing — needs the user to publish and try it.

## Move photo + video generation to app server
- [x] Point processors at studioperla.live, fix regional QStash address, enable direct photo processing.
- [x] Add real video generation (Perfect Corp image-to-video, Gemini motion prompt, saved to Supabase) wired to Generate video.
- [ ] Publish and run one signed-in photo + video on studioperla.live — needs the user to publish.

## Direct photo try-on migration
- [x] Build app-owned photo processing with authenticated server functions, category-specific Perfect Corp adapters and durable Upstash Workflow steps.
- [x] Save Perfect Corp, Gemini and QStash credentials securely; retain n8n behind a default-off direct activation flag and protect its trigger from direct jobs.
- [x] Add durable task progress/result paths, owner-scoped history restoration, real-photo like/share/delete persistence and no sample success for signed-in photo failures.
- [x] Pass 62 focused tests and current build; verify unsigned/invalid callbacks return 401 and public photo UI has no browser errors. Add simple activation instructions in PHOTO_GENERATION_SETUP.md.
- [ ] Publish and activate direct processing — blocked by publication permission; callback is not yet reachable publicly. QStash access checks returned 404, so delivery credentials remain unverified.
- [ ] Verify a real direct generation and reload in the signed-in UI — blocked by unavailable authenticated testing for external Supabase and the unpublished callback. Video/AI Studio remain outside this photo-only phase.

## Matching Try-On photo frames
- [x] Match input, output and comparison frame dimensions while keeping full photos visible.
- [x] Verify unchanged frame dimensions and working comparison slider at 1280px, 681px and 390px widths; no browser errors or horizontal overflow. Used local photo fixtures because external Supabase authenticated checks remain unavailable.

- [x] Redesign Discover with four product categories, product collage and star-to-Try-On selection.
- [x] Add photo/product uploads, animated loading, photo results and three-question feedback.
- [x] Add video preview, loading, follow-up questions, likes and downloads.
- [x] Remove Wardrobe/Credits screens and their navigation and credit labels; remove prices from Discover and Try-On.
- [x] Verify selection, uploads, both result stages, downloads and small-screen layout.

## Brand Insights refinement
- [x] Combine Discover-only product rankings into tall image cards with try-ons and likes.
- [x] Show shared virtual photos and playable videos with product, creator, likes and upload-source labels.
- [x] Verify sharing, liking, video playback and layout; preserve the remaining sections.

## Horizontal rows and homepage footer
- [x] Put both Brand Insights collections in single horizontal rows, remove ranking tabs, and show product and brand names.
- [x] Replace the homepage rating with the shared virtual try-on count and add Product, Account and Legal footer sections with the supplied support email.
- [x] Verify horizontal rows, shared count, footer links and existing tests.

## External database setup
- [x] Connect the user's separate external database (external Supabase connected and rebound).
- [x] Create `products` table (45 seeded products with real photo URLs) and load Discover from it via a public server function, with a working search bar.
- Deferred: generated looks, collections, likes and feedback tables remain outside the current input-saving scope.

## Photo and product input storage
- [x] Approve private user-photo storage and account-linked product-image records; uploaded product category defaults to unknown.
- [x] Create the required Supabase tables and private upload bucket with owner-only access.
- [x] Save uploads and Discover selections through the shared Try-On flow and restore saved inputs after reload.
- [x] Verify saved-input restoration and failures with focused tests, and owner-only table/storage access with database checks.
- [ ] Verify an actual signed-in upload and reload in the UI — blocked by unavailable authenticated testing for external Supabase.

## n8n try-on repair
- [x] Correct the existing workflow's trigger, category detection, polling and Supabase result saving.
- [x] Validate and test both Discover and unknown-category paths without publishing or spending generation credits.
- [x] Publish the repaired n8n workflow after user approval and point Supabase's webhook at its production address.
- [x] Create public `generated-looks` with read-only public access and verify real generation — Supabase INSERT triggered production n8n, Perfect Corp generated Ivory Wrap Dress, n8n saved the JPEG, and the job completed; stored image loaded successfully.
- [ ] Verify a generated result appears in the signed-in Try-On UI — authenticated testing is unavailable for external Supabase; user must run Generate in their signed-in preview.
## AI Studio real generation
- [x] Base picker shows each finished try-on photo once; Model scene added and default (photo: model shoot, video: model walking).
- [x] Short shopper prompts are wrapped in a supporting fashion prompt; empty input still works with defaults.
- [x] Real images (AI image edit) and videos (Perfect Corp) saved to account; like, share, delete, download; shown in Profile.
- [ ] Signed-in browser check of a studio video — needs the user to try it after publishing.
