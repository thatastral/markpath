import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { extractFixtureBrandSpec } from "../src/server/brand/spec";

describe("fixture brand extraction", () => {
  it("extracts only source-supported Nexa rules", () => {
    const guideline = readFileSync("fixtures/nexa-brand-guidelines.md", "utf8");
    const spec = extractFixtureBrandSpec(guideline);
    expect(spec.version).toBe("2.0");
    expect(spec.extractionMode).toBe("fixture extraction");
    expect(spec.rules.map((rule) => rule.expected)).toEqual(expect.arrayContaining(["#2457F5", "Geist", "8px"]));
    expect(spec.rules.every((rule) => rule.status === "extracted" && rule.sourceReference.startsWith("Guideline line"))).toBe(true);
  });
});
