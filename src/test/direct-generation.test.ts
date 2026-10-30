import { describe, expect, it } from "vitest";
import { nextDirectAction, type DirectJobState } from "@/components/web/generation-rules";

const now = Date.parse("2026-10-28T06:00:00Z");
const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();
const job = (values: Partial<DirectJobState>): DirectJobState => ({ status: "pending", stage: "queued", kind: "photo", provider_task_id: null, created_at: ago(5), updated_at: ago(5), ...values });

describe("App-managed generation steps", () => {
  it("submits a new saved request", () => { expect(nextDirectAction(job({}), now)).toBe("submit"); });
  it("does nothing for finished requests", () => { expect(nextDirectAction(job({ status: "completed" }), now)).toBe("none"); });
  it("waits while another check is submitting", () => { expect(nextDirectAction(job({ status: "processing", stage: "submitting", updated_at: ago(10) }), now)).toBe("wait"); });
  it("never resubmits a stuck submission without a task ID", () => { expect(nextDirectAction(job({ status: "processing", stage: "submitting", updated_at: ago(120) }), now)).toBe("uncertain"); });
  it("polls the provider once a task ID is saved", () => { expect(nextDirectAction(job({ status: "processing", stage: "polling", provider_task_id: "t1" }), now)).toBe("poll"); });
  it("keeps polling a try-on photo within 1 minute", () => { expect(nextDirectAction(job({ status: "processing", stage: "polling", provider_task_id: "t1", created_at: ago(50) }), now)).toBe("poll"); });
  it("stops a try-on photo after 1 minute", () => { expect(nextDirectAction(job({ status: "processing", stage: "polling", provider_task_id: "t1", created_at: ago(61) }), now)).toBe("expired"); });
  it("stops a try-on photo stuck before submission after 1 minute", () => { expect(nextDirectAction(job({ status: "processing", stage: "queued", created_at: ago(61) }), now)).toBe("expired"); });
  it("gives an AI Studio photo up to 10 minutes", () => { expect(nextDirectAction(job({ status: "processing", stage: "polling", provider_task_id: "t1", studio_scene: "model", created_at: ago(5 * 60) }), now)).toBe("poll"); });
  it("allows a video up to 30 minutes", () => { expect(nextDirectAction(job({ kind: "video", status: "processing", stage: "polling", provider_task_id: "t1", created_at: ago(20 * 60) }), now)).toBe("poll"); });
  it("waits while a result is being saved, then retries a stale save", () => {
    expect(nextDirectAction(job({ status: "processing", stage: "saving", provider_task_id: "t1", updated_at: ago(10) }), now)).toBe("wait");
    expect(nextDirectAction(job({ status: "processing", stage: "saving", provider_task_id: "t1", updated_at: ago(120) }), now)).toBe("poll");
  });
});
