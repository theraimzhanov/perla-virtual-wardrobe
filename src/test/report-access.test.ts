import { afterEach, describe, expect, it, vi } from "vitest";
import { insightsAuthorized } from "@/components/web/weekly-insights.server";

afterEach(() => vi.unstubAllEnvs());

describe("private n8n reporting access", () => {
  it("accepts n8n's stored service credential but rejects anonymous and browser publishable keys", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-only");
    vi.stubEnv("PERLA_INSIGHTS_SECRET", "test-report-only");
    const request = (apikey?: string) => new Request("https://perla.example/api/public/insights/sheets", { headers: apikey ? { apikey } : {} });
    expect(insightsAuthorized(request("test-service-only"))).toBe(true);
    expect(insightsAuthorized(request("test-publishable"))).toBe(false);
    expect(insightsAuthorized(request())).toBe(false);
  });

  it("rejects reporting access when server credentials are absent", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("PERLA_INSIGHTS_SECRET", "");
    expect(insightsAuthorized(new Request("https://perla.example", { headers: { apikey: "test-service-only" } }))).toBe(false);
  });
});