import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createSeed } from "@/lib/domain";

describe("bundled visual assets", () => {
  it("ships every seeded advisor portrait as a valid local JPEG", () => {
    for (const astrologer of createSeed("2026-09-19").astrologers) {
      const file = resolve("public", astrologer.image.slice(1));
      expect(existsSync(file), astrologer.image).toBe(true);
      const image = readFileSync(file);
      expect(image.subarray(0, 3).toString("hex"), astrologer.image).toBe("ffd8ff");
      expect(image.length).toBeGreaterThan(1000);
    }
  });
  it("bundles story photography and licensed fonts instead of remote runtime dependencies", () => {
    for (const file of ["story/dawn.jpg", "story/perspective.jpg", "fonts/gloock.ttf", "fonts/manrope.ttf", "fonts/gloock-license.txt", "fonts/manrope-license.txt"]) {
      expect(readFileSync(resolve("public", file)).length, file).toBeGreaterThan(500);
    }
  });
});
