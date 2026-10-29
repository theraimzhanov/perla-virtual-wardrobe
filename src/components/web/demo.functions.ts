import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { demoApplicationSchema } from "./demo-rules";

export const submitDemoApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => demoApplicationSchema.parse(input))
  .handler(async ({ data }) => {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error("Applications are temporarily unavailable. Please contact PERLA support.");
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const { error } = await client.from("brand_demo_applications").insert({
      request_id: data.requestId, name: data.name, email: data.email,
      brand: data.brand, message: data.message, consent: data.consent,
    });
    if (error && error.code !== "23505") throw new Error("Couldn't submit your application. Please try again.");
    return { submitted: true };
  });