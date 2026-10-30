import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePhotoGeneration } from "@/components/web/usePhotoGeneration";
import type { PhotoJob } from "@/components/web/generation-rules";

const mocks = vi.hoisted(() => ({ create: vi.fn(), read: vi.fn(), getUser: vi.fn(), remove: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/components/web/generation.functions", () => ({ createGenerationJob: mocks.create, getPhotoJob: mocks.read }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser }, removeChannel: mocks.remove, channel: () => ({ on() { return this; }, subscribe() { return this; } }) } }));
const owner = "11111111-1111-4111-8111-111111111111";
const job: PhotoJob = { id: "22222222-2222-4222-8222-222222222222", kind: "photo", video: null, status: "completed", stage: "completed", image: "https://storage.example/real.jpg", error: null, title: "Bag", source: "discover", liked: false, shared: false, photoId: "photo", productId: "product" };

describe("Account-scoped photo generation", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id: owner } } }); mocks.create.mockResolvedValue({ jobId: job.id }); mocks.read.mockResolvedValue(job); });
  afterEach(() => { vi.useRealTimers(); });
  it("dismisses a timeout exactly after three seconds without changing its failed status or restoring it on refresh", async () => {
    vi.useFakeTimers();
    const failed: PhotoJob = { ...job, status: "failed", image: null, error: "This try-on took too long. Please try again." };
    mocks.read.mockResolvedValue(failed);
    const { result, rerender } = renderHook(({ restored }) => usePhotoGeneration(owner, "selection", restored), { initialProps: { restored: failed } });
    expect(result.current.error).not.toBeNull();
    act(() => { vi.advanceTimersByTime(2999); });
    expect(result.current.error).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.error).toBeNull();
    expect(result.current.phase).toBe("failed");
    expect(result.current.job?.image).toBeNull();
    await act(async () => { result.current.retryStatus(); });
    rerender({ restored: { ...failed } });
    expect(result.current.error).toBeNull();
  });
  it("gives a newly failed attempt its own three-second timeout message", () => {
    vi.useFakeTimers();
    const failed: PhotoJob = { ...job, status: "failed", image: null, error: "This try-on took too long, so it was stopped. Please try again." };
    const { result, rerender } = renderHook(({ restored }) => usePhotoGeneration(owner, "selection", restored), { initialProps: { restored: failed } });
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.error).toBeNull();
    rerender({ restored: { ...failed, id: "44444444-4444-4444-8444-444444444444" } });
    expect(result.current.error).not.toBeNull();
    act(() => { vi.advanceTimersByTime(2999); });
    expect(result.current.error).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.error).toBeNull();
  });
  it("keeps non-timeout failures available instead of dismissing them", () => {
    vi.useFakeTimers();
    const failed: PhotoJob = { ...job, status: "failed", image: null, error: "Provider failed" };
    const { result } = renderHook(() => usePhotoGeneration(owner, "selection", failed));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.error).toBe("Provider failed");
  });
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