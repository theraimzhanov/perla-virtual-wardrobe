export type ProductLink = { productId: string | null; catalogProductId: string | null; productImage: string | null };
export type LinkedJob = { user_id: string; product_id: string | null };
export type LinkedPiece = { id: string; user_id: string; source: string; catalog_product_id: string | null; storage_path: string | null; image_url: string | null };

export const emptyProductLink = (): ProductLink => ({ productId: null, catalogProductId: null, productImage: null });
export const canTryProduct = (link: Pick<ProductLink, "catalogProductId" | "productImage">) => Boolean(link.catalogProductId || link.productImage);

// A saved input ID is owner-specific; never resolve it through somebody else's upload.
export function linkedProduct(job: LinkedJob, piece: LinkedPiece | undefined): LinkedPiece | null {
  if (!piece || job.product_id !== piece.id || job.user_id !== piece.user_id) return null;
  if (piece.source === "discover") return piece.catalog_product_id ? piece : null;
  if (piece.source !== "upload" || piece.catalog_product_id || !piece.storage_path?.startsWith(`${job.user_id}/products/`)) return null;
  return piece;
}

// Restyling retains the original piece, not the generated scene as the product image.
export function studioProductFields<T extends LinkedJob & { source: string; category: string; product_name: string | null; brand_name: string | null; item_image_url: string }>(base: T, piece: LinkedPiece | undefined) {
  if (!linkedProduct(base, piece)) throw new Error("This look's original product is unavailable. Choose another try-on.");
  return { product_id: base.product_id, source: base.source, category: base.category, product_name: base.product_name, brand_name: base.brand_name, item_image_url: base.item_image_url };
}