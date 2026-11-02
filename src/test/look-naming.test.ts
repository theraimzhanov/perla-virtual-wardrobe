import { describe, expect, it } from "vitest";
import { lookDisplayName, sourceLabel, type Look } from "@/components/web/looks";

const base = { id: "x", title: "7122FA+ANCL._AC_UF894,1000_QL80_", author: "Islambek", kind: "photo" as const, image: "a.jpg", likes: 0, liked: false, shared: true, mine: false };

describe("look naming", () => {
  it("never shows an upload file name as the card title", () => {
    expect(lookDisplayName({ ...base, source: "own", product: base.title })).toBe("Own upload");
    expect(lookDisplayName({ ...base, source: "internet", product: "IMG_2048.png" })).toBe("Internet find");
    expect(lookDisplayName({ ...base, source: "store", product: "receipt_0042" })).toBe("Store piece");
  });

  it("keeps the catalogue name for Discover pieces", () => {
    expect(lookDisplayName({ ...base, source: "discover", product: "Silk Blouse" })).toBe("Silk Blouse");
    expect(lookDisplayName({ ...base, source: "discover" })).toBe("7122FA+ANCL._AC_UF894,1000_QL80_");
    expect(lookDisplayName(base)).toBe("7122FA+ANCL._AC_UF894,1000_QL80_");
  });

  it("labels every outside-Discover source without repeating the card title", () => {
    expect(sourceLabel("own")).toBe("Outside Discover");
    expect(sourceLabel("internet")).toBe("Outside Discover");
    expect(sourceLabel("store")).toBe("Outside Discover");
    expect(sourceLabel("discover")).toBeNull();
    expect(sourceLabel(undefined)).toBeNull();
  });
});
