import { describe, expect, it } from "vitest";
import { demoApplicationSchema } from "@/components/web/demo-rules";
import { sampleModels } from "@/components/web/sample-models";

const application = { requestId: "11111111-1111-4111-8111-111111111111", name: "Demo Tester", email: "test@example.com", brand: "Test Brand", message: "", consent: true };
describe("Demo applications and sample photos", () => {
  it("requires consent before accepting an application", () => { expect(demoApplicationSchema.safeParse({ ...application, consent: false }).success).toBe(false); expect(demoApplicationSchema.safeParse(application).success).toBe(true); });
  it("rejects invalid contact addresses", () => { expect(demoApplicationSchema.safeParse({ ...application, email: "not-an-email" }).success).toBe(false); });
  it("offers three male sample models", () => { expect(sampleModels.filter((model) => model.group === "Men")).toHaveLength(3); });
  it("offers three female sample models", () => { expect(sampleModels.filter((model) => model.group === "Women")).toHaveLength(3); });
});