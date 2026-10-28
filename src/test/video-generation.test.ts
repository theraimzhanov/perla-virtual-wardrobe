import { describe, expect, it } from "vitest";
import { firstResultUrl } from "@/components/web/generation-provider.server";
import { photoJobPhase } from "@/components/web/generation-rules";

describe("video generation rules", () => {
  it("finds the video address in nested provider results", () => { expect(firstResultUrl({ videos: [{ url: "https://cdn.makeupar.com/v.mp4" }] })).toBe("https://cdn.makeupar.com/v.mp4"); });
  it("ignores non-https results", () => { expect(firstResultUrl({ url: "http://x/v.mp4" })).toBeNull(); });
  it("a completed video job without a saved video is a failure, not a sample", () => { expect(photoJobPhase({ kind: "video", status: "completed", image: null, video: null })).toBe("failed"); });
  it("a completed video job with a saved video is done", () => { expect(photoJobPhase({ kind: "video", status: "completed", image: null, video: "https://storage.example/v.mp4" })).toBe("done"); });
});
