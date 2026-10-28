import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DiscoverCategory, DiscoverProduct } from "./data";

const categories: DiscoverCategory[] = ["Clothes", "Bag", "Hat", "Shoes"];

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DiscoverProduct[]> => {
    const { data, error } = await context.supabase
      .from("products")
      .select("id, name, brand, style, category, image_url")
      .order("created_at", { ascending: true });
    if (error) {
      console.error(`Product catalog request failed: ${error.message}`);
      return [];
    }
    return (data ?? []).map((row): DiscoverProduct => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      style: row.style,
      image: row.image_url,
      category: categories.includes(row.category as DiscoverCategory) ? (row.category as DiscoverCategory) : "Clothes",
      source: "discover",
    }));
  });
