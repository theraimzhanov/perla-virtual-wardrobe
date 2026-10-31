import { describe, expect, it } from "vitest";
import { fileExtension, fileStem, mediaFileName } from "@/components/web/media-download";

describe("Saved picture names", () => {
  it("keeps the look recognisable and safe for a file", () => {
    expect(fileStem("Golden Hour · Silk Slip")).toBe("golden-hour-silk-slip");
  });
  it("never produces an empty or over-long file name", () => {
    expect(fileStem("···")).toBe("perla-look");
    expect(fileStem("a".repeat(90))).toHaveLength(48);
    expect(fileStem("over-".repeat(20))).not.toMatch(/-$/);
  });
  it("matches the extension to the saved bytes", () => {
    expect(fileExtension("image/jpeg")).toBe("jpg");
    expect(fileExtension("image/png")).toBe("png");
    expect(fileExtension("image/png; charset=binary")).toBe("png");
    expect(fileExtension("application/octet-stream")).toBe("jpg");
  });
  it("names the downloaded file after the look and its real type", () => {
    expect(mediaFileName("Street Editorial", "image/png")).toBe("street-editorial.png");
    expect(mediaFileName("Golden Hour · Silk Slip", "image/jpeg")).toBe("golden-hour-silk-slip.jpg");
    expect(mediaFileName("perla try-on", "image/jpeg")).toBe("perla-try-on.jpg");
  });
});
