import { afterEach, describe, expect, it, vi } from "vitest";
import { boundedImage, pollPhoto, submitPhoto, submitStudio } from "@/components/web/generation-provider.server";

describe("Perfect Corp photo adapter", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("sends AI Studio restyles to YouCam image-to-image with an 800-character prompt", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ status: 200, data: { task_id: "studio-task" } }));
    vi.stubGlobal("fetch", fetcher);
    expect(await submitStudio("https://x/look.jpg", "a".repeat(900), "k")).toEqual({ taskId: "studio-task", endpoint: "image-to-image/youcam" });
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://yce-api-01.makeupar.com/s2s/v2.0/task/image-to-image/youcam");
    const body = JSON.parse(fetcher.mock.calls[0]?.[1].body);
    expect(body.model).toBe("youcam-image-v2");
    expect(body.prompt).toHaveLength(800);
  });
  it("submits the clothes-v4 contract and saves the opaque task ID", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ status: 200, data: { task_id: "opaque-task" } }));
    vi.stubGlobal("fetch", fetcher);
    expect(await submitPhoto("Clothes", "person", "product", null, "test-credential")).toEqual({ taskId: "opaque-task", endpoint: "cloth-v4" });
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://yce-api-01.makeupar.com/s2s/v2.0/task/cloth-v4");
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toMatchObject({ garment_category: "auto", change_shoes: false });
  });
  it("retrieves the actual completed URL from nested task results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: 200, data: { task_status: "success", results: { url: "https://images.makeupar.com/result.jpg" } } })));
    expect(await pollPhoto("bag", "task", "test-credential")).toEqual({ finished: true, url: "https://images.makeupar.com/result.jpg" });
  });
  it("rejects a provider failure even when HTTP succeeded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: 200, data: { task_status: "error", results: null } })));
    await expect(pollPhoto("hat", "task", "test-credential")).rejects.toThrow("couldn't generate");
  });
  it("does not expose provider-returned sensitive error data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error_code: "BadRequest", error: "sensitive-provider-data" }, { status: 400 })));
    await expect(submitPhoto("Shoes", "person", "product", null, "test-credential")).rejects.toThrow("couldn't process");
  });
  it("rejects oversized image downloads before saving", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bytes", { headers: { "content-type": "image/jpeg", "content-length": "50" } })));
    await expect(boundedImage("https://images.makeupar.com/result.jpg", 10)).rejects.toThrow("too large");
  });
});