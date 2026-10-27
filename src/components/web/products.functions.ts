import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { DiscoverCategory, DiscoverProduct } from "./data";

const categories: DiscoverCategory[] = ["Clothes", "Bag", "Hat", "Shoes"];

export const listProducts = createServerFn({ method: "GET" }).handler(async (): Promise<DiscoverProduct[]> => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    // Opaque sb_ keys aren't JWTs; send only apikey, not the default Authorization bearer.
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await supabasePublic
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
