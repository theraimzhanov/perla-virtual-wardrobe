import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { uploadBucket } from "./upload-rules";
import { emptyProductLink, linkedProduct, type LinkedJob, type ProductLink } from "./product-links";

// Only the original product leaves this boundary; original model photos and storage paths never do.
export async function loadProductLinks(client: SupabaseClient<Database>, jobs: (LinkedJob & { id: string })[]): Promise<Map<string, ProductLink>> {
  const ids = [...new Set(jobs.flatMap((job) => job.product_id ? [job.product_id] : []))];
  if (!ids.length) return new Map();
  const { data: pieces, error } = await client.from("try_on_products").select("id,user_id,source,catalog_product_id,storage_path,image_url").in("id", ids);
  if (error) throw new Error("Couldn't load the original products.");
  const catalogIds = [...new Set((pieces ?? []).flatMap((piece) => piece.catalog_product_id ? [piece.catalog_product_id] : []))];
  const catalog = catalogIds.length ? await client.from("products").select("id,image_url").in("id", catalogIds) : { data: [], error: null };
  if (catalog.error) throw new Error("Couldn't load Discover products.");
  const pieceOf = new Map((pieces ?? []).map((piece) => [piece.id, piece]));
  const images = new Map(await Promise.all((pieces ?? []).map(async (piece) => {
    // Verify the folder before issuing any temporary product-only access link.
    const valid = linkedProduct({ user_id: piece.user_id, product_id: piece.id }, piece);
    if (!valid || valid.source === "discover") return [piece.id, null] as const;
    const image = valid.storage_path ? (await client.storage.from(uploadBucket).createSignedUrl(valid.storage_path, 3600)).data?.signedUrl ?? null : null;
    return [piece.id, image] as const;
  })));
  return new Map(jobs.map((job) => {
    const piece = linkedProduct(job, job.product_id ? pieceOf.get(job.product_id) : undefined);
    if (!piece) return [job.id, emptyProductLink()];
    if (piece.source === "discover") {
      const product = catalog.data?.find((item) => item.id === piece.catalog_product_id);
      return [job.id, product ? { productId: piece.id, catalogProductId: product.id, productImage: product.image_url } : emptyProductLink()];
    }
    const image = images.get(piece.id) ?? null;
    return [job.id, image ? { productId: piece.id, catalogProductId: null, productImage: image } : emptyProductLink()];
  }));
}