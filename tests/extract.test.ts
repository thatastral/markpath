import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDesignLink, suggestFromText } from "../src/server/brand/extract";

describe("brand extraction", () => {
  it("reads the sample guideline's labelled values and the old ones", () => {
    const s = suggestFromText(readFileSync(join(process.cwd(), "fixtures", "nexa-brand-guidelines.md"), "utf8"));
    expect(s.primaryColour).toBe("#2457F5"); expect(s.typeface).toBe("Geist"); expect(s.buttonRadius).toBe("8px");
    expect(s.previousColour).toBe("#164B9B");
  });
  it("reads CSS from a website without picking up page text", () => {
    const s = suggestFromText(":root{--brand-primary:#5E6AD2;--text:#111111} body{font-family:\"Inter Display\", sans-serif} .btn{border-radius:6px} .card{border-radius:6px}", "website");
    expect(s).toMatchObject({ primaryColour: "#5E6AD2", typeface: "Inter Display", buttonRadius: "6px", voice: undefined, previousColour: undefined });
  });
  it("ignores greys and common words", () => {
    const s = suggestFromText("The typeface: The quick brown fox. Colour #222222 and #2457F5.");
    expect(s.typeface).toBeUndefined(); expect(s.primaryColour).toBe("#2457F5");
  });
  it("recognises design links", () => {
    expect(isDesignLink("https://www.figma.com/design/abc123/x")).toBe("figma");
    expect(isDesignLink("https://www.canva.com/design/DAHaL7l9y7c/edit")).toBe("canva");
    expect(isDesignLink("https://linear.app")).toBeNull();
  });
});
