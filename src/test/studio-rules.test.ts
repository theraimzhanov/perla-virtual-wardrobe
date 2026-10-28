import { describe, expect, it } from "vitest";
import { buildStudioPrompt, cleanUserPrompt, DEFAULT_STUDIO_SCENE, studioRequestSchema, studioSceneNames } from "@/components/web/studio-rules";
import { nextDirectAction } from "@/components/web/generation-rules";

const ids = { expectedOwner: crypto.randomUUID(), requestId: crypto.randomUUID(), baseJobId: crypto.randomUUID() };

describe("AI Studio rules", () => {
  it("defaults to the Model scene when nothing is chosen", () => {
    expect(DEFAULT_STUDIO_SCENE).toBe("Model");
    expect(studioRequestSchema.parse({ ...ids, kind: "photo" }).scene).toBe("Model");
  });
  it("includes the new Model scene among the scenes", () => {
    expect(studioSceneNames).toContain("Model");
    expect(studioSceneNames).toContain("Golden Hour");
  });
  it("default video is a model walking", () => {
    expect(buildStudioPrompt("video", "Model", "")).toMatch(/walks/i);
  });
  it("still keeps the outfit unchanged when the shopper writes nothing", () => {
    expect(buildStudioPrompt("photo", "Model", "")).toMatch(/garment.*exactly unchanged/i);
  });
  it("adds the shopper's short idea as style direction", () => {
    expect(buildStudioPrompt("photo", "Street", "  in   Paris ")).toContain('"in Paris"');
  });
  it("caps the shopper's prompt at 300 characters", () => {
    expect(cleanUserPrompt("a".repeat(500))).toHaveLength(300);
  });
  it("never repeats an interrupted studio render", () => {
    const now = Date.now();
    const job = { status: "processing", stage: "rendering", kind: "photo", provider_task_id: null, created_at: new Date(now - 60_000).toISOString(), updated_at: new Date(now - 60_000).toISOString() };
    expect(nextDirectAction(job, now)).toBe("wait");
    expect(nextDirectAction({ ...job, updated_at: new Date(now - 6 * 60_000).toISOString() }, now)).toBe("uncertain");
  });
});
