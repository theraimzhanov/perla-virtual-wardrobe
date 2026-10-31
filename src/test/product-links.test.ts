import { describe, expect, it } from "vitest";
import { canTryProduct, linkedProduct, studioProductFields } from "@/components/web/product-links";

const piece = { id: "saved-product", user_id: "owner", source: "discover", catalog_product_id: "discover-product", storage_path: null, image_url: "product.jpg" };
const base = { user_id: "owner", product_id: piece.id, source: "discover", category: "Clothes", product_name: "Dress", brand_name: "Brand", item_image_url: "original-product.jpg" };

describe("Community product provenance", () => {
  it("keeps the original Discover product on an AI Studio restyle", () => {
    expect(studioProductFields(base, piece)).toEqual({ product_id: "saved-product", source: "discover", category: "Clothes", product_name: "Dress", brand_name: "Brand", item_image_url: "original-product.jpg" });
  });
  it("keeps the original personal product on an AI Studio restyle", () => {
    const upload = { ...piece, source: "upload", catalog_product_id: null, storage_path: "owner/products/piece.png" };
    expect(studioProductFields({ ...base, source: "own" }, upload).product_id).toBe("saved-product");
  });
  it("rejects an unlinked or missing original product", () => {
    expect(() => studioProductFields(base, undefined)).toThrow();
    expect(linkedProduct({ ...base, product_id: null }, piece)).toBeNull();
  });
  it("does not resolve another account's product", () => {
    expect(linkedProduct(base, { ...piece, user_id: "other-owner" })).toBeNull();
  });
  it("never shares a private model photo as a product", () => {
    expect(linkedProduct(base, { ...piece, source: "upload", catalog_product_id: null, storage_path: "owner/photos/model.png" })).toBeNull();
  });
  it("requires a usable Discover ID or original product image to try a community look", () => {
    expect(canTryProduct({ catalogProductId: null, productImage: null })).toBe(false);
    expect(canTryProduct({ catalogProductId: "discover-product", productImage: null })).toBe(true);
    expect(canTryProduct({ catalogProductId: null, productImage: "private-product-link" })).toBe(true);
  });
});