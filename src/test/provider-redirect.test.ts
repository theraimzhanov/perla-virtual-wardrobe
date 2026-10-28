import { describe, expect, it } from "vitest";
import { isRedirect } from "@/components/web/generation-provider.server";

describe("provider redirect guard (Workers only allow follow/manual)", () => {
  it("treats a 302 response as a redirect", () => {
    expect(isRedirect(new Response(null, { status: 302 }))).toBe(true);
  });
  it("does not treat a 200 response as a redirect", () => {
    expect(isRedirect(new Response("{}", { status: 200 }))).toBe(false);
  });
});
