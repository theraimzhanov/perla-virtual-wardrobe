import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Public sitemap", () => {
  it("lists only the public homepage, not account screens or API endpoints", () => {
    const xml = readFileSync("public/sitemap.xml", "utf8");
    const document = new DOMParser().parseFromString(xml, "application/xml");

    expect(document.querySelector("parsererror")).toBeNull();
    expect(document.documentElement.namespaceURI).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
    expect(Array.from(document.getElementsByTagName("loc"), (entry) => entry.textContent)).toEqual([
      "https://studioperla.live/",
    ]);
  });
});