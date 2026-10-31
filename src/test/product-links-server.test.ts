import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { loadProductLinks } from "@/components/web/product-links.server";

const discover = { id: "discover-input", user_id: "owner", source: "discover", catalog_product_id: "catalog-id", storage_path: null, image_url: "old-image.jpg" };
const upload = { ...discover, id: "upload-input", source: "upload", catalog_product_id: null, storage_path: "owner/products/bag.png", image_url: null };
function client(pieces: (typeof discover | typeof upload)[], catalog = [{ id: "catalog-id", image_url: "current-product.jpg" }]) {
  const sign = vi.fn(async (path: string) => ({ data: { signedUrl: `https://storage.example/product?path=${path}` }, error: null }));
  const api = { from: (table: string) => ({ select: () => ({ in: async () => ({ data: table === "products" ? catalog : pieces, error: null }) }) }), storage: { from: () => ({ createSignedUrl: sign }) } };
  return { api: api as unknown as SupabaseClient<Database>, sign };
}
describe("Original product display links", () => {
  it("resolves both Try-On and Studio jobs to the same current Discover product", async () => {
    const { api } = client([discover]);
    const links = await loadProductLinks(api, [{ id: "try-on", user_id: "owner", product_id: discover.id }, { id: "studio", user_id: "owner", product_id: discover.id }]);
    expect(links.get("try-on")).toEqual({ productId: "discover-input", catalogProductId: "catalog-id", productImage: "current-product.jpg" });
    expect(links.get("studio")).toEqual(links.get("try-on"));
  });
  it("provides only a renewable personal product link for another member's community card", async () => {
    const { api, sign } = client([upload]);
    const links = await loadProductLinks(api, [{ id: "shared-studio", user_id: "owner", product_id: upload.id }]);
    expect(links.get("shared-studio")).toEqual({ productId: "upload-input", catalogProductId: null, productImage: "https://storage.example/product?path=owner/products/bag.png" });
    expect(sign).toHaveBeenCalledWith("owner/products/bag.png", 3600);
    expect(links.get("shared-studio")).not.toHaveProperty("storage_path");
  });
  it("never signs a private model photo masquerading as a product", async () => {
    const { api, sign } = client([{ ...upload, storage_path: "owner/photos/model.png" }]);
    const links = await loadProductLinks(api, [{ id: "bad-link", user_id: "owner", product_id: upload.id }]);
    expect(links.get("bad-link")).toEqual({ productId: null, catalogProductId: null, productImage: null });
    expect(sign).not.toHaveBeenCalled();
  });
  it("excludes retired Discover products instead of using their stale image", async () => {
    const { api } = client([discover], []);
    const links = await loadProductLinks(api, [{ id: "retired", user_id: "owner", product_id: discover.id }]);
    expect(links.get("retired")).toEqual({ productId: null, catalogProductId: null, productImage: null });
  });
});