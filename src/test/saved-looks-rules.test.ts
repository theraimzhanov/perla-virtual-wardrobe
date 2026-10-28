import { describe, expect, it } from "vitest";
import { feedbackSchema, pickShownJob } from "@/components/web/generation-rules";

const job = (id: string, status: string, createdAt: string) => ({ id, status, createdAt });
const jobId = "33333333-3333-4333-8333-333333333333";

describe("saved Try-On result", () => {
  it("shows the saved look when nothing is on screen", () => { expect(pickShownJob(null, job("a", "completed", "2026-10-28T01:00:00Z")).id).toBe("a"); });
  it("a newer generation replaces the old saved look", () => { expect(pickShownJob(job("a", "completed", "2026-10-28T01:00:00Z"), job("b", "pending", "2026-10-28T02:00:00Z")).id).toBe("b"); });
  it("a stale list never rolls a finished look back to generating", () => { expect(pickShownJob(job("a", "completed", "t"), job("a", "processing", "t")).status).toBe("completed"); });
});

describe("feedback answers", () => {
  it("accepts exactly three answers", () => { expect(feedbackSchema.safeParse({ jobId, answers: { style: "Yes", fit: "Just right", wear: "Maybe" } }).success).toBe(true); });
  it("rejects incomplete feedback", () => { expect(feedbackSchema.safeParse({ jobId, answers: { style: "Yes" } }).success).toBe(false); });
  it("rejects unknown questions", () => { expect(feedbackSchema.safeParse({ jobId, answers: { style: "Yes", fit: "Ok", price: "$1" } }).success).toBe(false); });
  it("accepts five photo answers", () => { expect(feedbackSchema.safeParse({ jobId, answers: { fit: "Just right", occasion: "Everyday", color: "Perfect as is", price: "Fair price", intent: "Definitely" } }).success).toBe(true); });
  it("rejects four answers", () => { expect(feedbackSchema.safeParse({ jobId, answers: { fit: "Just right", occasion: "Everyday", color: "Perfect as is", price: "Fair price" } }).success).toBe(false); });
});
