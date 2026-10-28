# Perla update

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