import { describe, expect, it } from "vitest";
import { generationRequestSchema, photoJobPhase, providerBody, providerEndpoint, resultObjectPath, trustedMediaUrl } from "@/components/web/generation-rules";

describe("Direct photo-generation rules", () => {
  it.each([["Clothes", "cloth-v4"], ["Bag", "bag"], ["Hat", "hat"], ["Shoes", "shoes-transfer"]])("routes %s to its own Perfect Corp API", (category, endpoint) => { expect(providerEndpoint(category)).toBe(endpoint); });
  it("rejects unknown products until classification identifies their category", () => { expect(() => providerEndpoint("unknown")).toThrow(); });
  it("never shows a pending request as a finished sample", () => { expect(photoJobPhase({ status: "pending", image: null })).toBe("loading"); });
  it("never substitutes a sample when generation fails", () => { expect(photoJobPhase({ status: "failed", image: null })).toBe("failed"); });
  it("rejects completion without an actual saved image", () => { expect(photoJobPhase({ status: "completed", image: null })).toBe("failed"); });
  it("shows the actual completed image", () => { expect(photoJobPhase({ status: "completed", image: "https://storage.example/look.jpg" })).toBe("done"); });
  it("requires the user's accessory fit instead of guessing gender", () => { expect(() => providerBody("Bag", "person", "product", null)).toThrow(); expect(providerBody("Hat", "person", "product", "male")).toMatchObject({ gender: "male" }); });
  it("preserves shoe transfers without unsupported gender parameters", () => { expect(providerBody("Shoes", "person", "product", null)).toEqual({ src_file_url: "person", ref_file_url: "product" }); });
  it("uses a stable owner-bound path for repeated result saves", () => { expect(resultObjectPath("owner", "job", "image/jpeg")).toBe("owner/tryon/job.jpg"); });
  it("rejects caller-controlled internal image URLs", () => { expect(() => trustedMediaUrl("https://127.0.0.1/image", "input", "https://perla.supabase.co")).toThrow(); });
  it("rejects unexpected provider download hosts", () => { expect(() => trustedMediaUrl("https://attacker.example/image", "result", "https://perla.supabase.co")).toThrow(); });
  it("requires a stable UUID for request deduplication", () => { expect(generationRequestSchema.safeParse({ expectedOwner: "11111111-1111-4111-8111-111111111111", requestId: "retry" }).success).toBe(false); });
});