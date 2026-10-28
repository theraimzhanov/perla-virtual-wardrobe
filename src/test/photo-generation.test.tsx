import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePhotoGeneration } from "@/components/web/usePhotoGeneration";
import type { PhotoJob } from "@/components/web/generation-rules";

const mocks = vi.hoisted(() => ({ create: vi.fn(), read: vi.fn(), getUser: vi.fn(), remove: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/components/web/generation.functions", () => ({ createGenerationJob: mocks.create, getPhotoJob: mocks.read }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser }, removeChannel: mocks.remove, channel: () => ({ on() { return this; }, subscribe() { return this; } }) } }));
const owner = "11111111-1111-4111-8111-111111111111";
const job: PhotoJob = { id: "22222222-2222-4222-8222-222222222222", status: "completed", stage: "completed", image: "https://storage.example/real.jpg", error: null, title: "Bag", source: "discover", liked: false, shared: false, photoId: "photo", productId: "product" };

describe("Account-scoped photo generation", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id: owner } } }); mocks.create.mockResolvedValue({ jobId: job.id }); mocks.read.mockResolvedValue(job); });
  it("restores a real completed photo", async () => {
    const { result } = renderHook(() => usePhotoGeneration(owner, "selection", job));
    await waitFor(() => expect(result.current.phase).toBe("done"));
    expect(result.current.job?.image).toBe("https://storage.example/real.jpg");
  });
  it("clears a restored private result when the owner changes", async () => {
    const { result, rerender } = renderHook(({ user, restored }) => usePhotoGeneration(user, "selection", restored), { initialProps: { user: owner, restored: job as PhotoJob | undefined } });
    await waitFor(() => expect(result.current.phase).toBe("done"));
    rerender({ user: "33333333-3333-4333-8333-333333333333", restored: undefined });
    await waitFor(() => expect(result.current.job).toBeNull());
  });
  it("reads an already-completed request immediately after creation", async () => {
    const { result } = renderHook(() => usePhotoGeneration(owner, "selection", undefined));
    await act(async () => { await result.current.start("female"); });
    expect(result.current.phase).toBe("done");
    expect(mocks.read).toHaveBeenCalledWith({ data: { id: job.id } });
  });
  it("keeps one request key when delivery fails and the user retries", async () => {
    mocks.create.mockRejectedValueOnce(new Error("Delivery unavailable"));
    const { result } = renderHook(() => usePhotoGeneration(owner, "selection", undefined));
    await act(async () => { await result.current.start("female"); });
    await act(async () => { await result.current.start("female"); });
    expect(mocks.create.mock.calls[0]?.[0].data.requestId).toBe(mocks.create.mock.calls[1]?.[0].data.requestId);
  });
  it("does not turn a failed request into a sample photo", async () => {
    mocks.read.mockResolvedValue({ ...job, status: "failed", image: null, error: "Provider failed" });
    const { result } = renderHook(() => usePhotoGeneration(owner, "selection", undefined));
    await act(async () => { await result.current.start(null); });
    expect(result.current.phase).toBe("failed");
    expect(result.current.job?.image).toBeNull();
  });
  it("ignores completion after an account switch", async () => {
    let complete: ((value: PhotoJob) => void) | undefined;
    mocks.read.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
    const { result, rerender } = renderHook(({ user }) => usePhotoGeneration(user, "selection", undefined), { initialProps: { user: owner } });
    let starting: Promise<void> | undefined;
    await act(async () => { starting = result.current.start(null); });
    rerender({ user: "33333333-3333-4333-8333-333333333333" });
    await act(async () => { complete?.(job); await starting; });
    expect(result.current.job).toBeNull();
  });
});