import { describe, expect, it, vi } from "vitest";
import type { PhotoJob } from "@/components/web/generation-rules";

vi.mock("@/components/web/generation.functions", () => ({ changeGeneratedLook: vi.fn(), listPhotoJobs: vi.fn() }));
vi.mock("@/components/web/looks.functions", () => ({ hideWardrobePiece: vi.fn(), listCommunityLooks: vi.fn(), listWardrobe: vi.fn(), setLookLike: vi.fn() }));
vi.mock("@/components/web/products.functions", () => ({ listProducts: vi.fn() }));
vi.mock("@/components/web/useSavedTryOnInputs", () => ({ useSavedTryOnInputs: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { jobLook } from "@/components/web/TryOnContext";
import { sharedVirtualLooks } from "@/components/web/brand-insights-rules";

const job: PhotoJob = { id: "studio-job", kind: "photo", status: "completed", stage: "completed", image: "generated-scene.jpg", video: null, error: null, title: "Dress", source: "discover", liked: false, shared: true, photoId: "private-model-photo", productId: "saved-original-product", catalogProductId: "discover-dress", productImage: "original-dress.jpg", studioScene: "Runway" };

describe("Owner community cards", () => {
  it("retains the Discover product link on the owner's AI Studio card", () => {
    const look = jobLook(job);
    expect(look).toMatchObject({ productId: "saved-original-product", catalogProductId: "discover-dress", productImage: "original-dress.jpg" });
    expect(sharedVirtualLooks([look]).map((item) => item.id)).toEqual(["job:studio-job"]);
    expect(look).not.toHaveProperty("photoId");
  });
  it("retains the personal product image, not the Studio output, on the owner's card", () => {
    const look = jobLook({ ...job, source: "own", catalogProductId: null, productImage: "original-upload.png" });
    expect(look.productImage).toBe("original-upload.png");
    expect(look.image).toBe("generated-scene.jpg");
    expect(sharedVirtualLooks([look])).toHaveLength(1);
  });
});