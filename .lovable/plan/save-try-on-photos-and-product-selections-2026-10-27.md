# Save Try-On photos and product selections

## What will change
- When a signed-in user uploads their photo, save it privately in your Supabase and create a record linked to their account.
- Save selected Discover products with their existing image, product ID, name, brand, style and category. Reuse the catalog image rather than uploading another copy.
- Save personally uploaded product images privately. Set their category to **`unknown`**, keep their filename as the initial name, and leave unknown brand/style details empty instead of guessing.
- Remember the current photo and product selection so they return after refreshing or reopening Try-On.
- Show saving progress and upload errors, and prevent generation while inputs are still saving. Signed-out users must sign in to save uploads.

## Tables and storage
| Resource | Data |
| --- | --- |
| `user_photos` | ID, owner ID, storage path, original filename, image type, file size, creation time |
| `try_on_products` | ID, owner ID, source (`discover` or `upload`), catalog product ID when applicable, uploaded storage path or Discover image URL, name, brand, style, category, filename/type/size for uploads, creation time |
| `try_on_inputs` | One current selection per user: saved photo ID, product mode, selected product-record IDs, last update time |
| Private `user-uploads` bucket | User photos and personal product images, separated into account-owned folders |

Personal photos and uploads are readable only by their owner. The app displays them through temporary access links; database records keep permanent storage paths, not expiring links. Removing something from the current selection clears that selection without silently deleting its saved history.

## What stays unchanged
- Existing design, Discover search and photo/video preview stages.
- No n8n trigger, Perfect Corp call, real generation or automatic sharing in this step.
- No new Profile gallery or generated-look/collection persistence in this step.

## Technical details
- Add explicit database grants, owner-scoped row-level policies and validation for image metadata, ownership and selection references.
- Use authenticated TanStack server functions for metadata writes and saved-input reads; upload files through the Supabase Storage API with owner-only policies.
- Preserve the shared TryOnProvider for web and mobile. Add bearer-token attachment to the existing server-function middleware without replacing existing request protections.
- Clear private input state on sign-out or account changes; never restore one user's uploads into another user's session.
- Validate accepted image types and upload size in the app and storage configuration. Do not change the public catalog.
- Add focused tests for uploaded category `unknown`, Discover metadata retention, selection ownership and upload failure behavior.
- Verify database records and reload behavior end-to-end if a signed-in session is available. This external Supabase does not provide a managed test session; otherwise report the signed-in checks as unverified.