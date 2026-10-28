# Perla update

## Direct photo try-on migration
- [ ] Replace n8n photo processing with authenticated app-owned generation and durable asynchronous processing.
- [ ] Configure Perfect Corp, Gemini and delayed-delivery credentials; retain existing n8n until the replacement is verified.
- [ ] Persist task progress and finished media, restore results across reloads, and show real failures instead of sample success.
- [ ] Test ownership, retry/idempotency behavior and photo-generation flow; document dashboard steps and remaining verification blockers.

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