import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { scanGithubFixture } from "../src/server/audits/github-fixture";
import { scanFigmaFixture } from "../src/server/audits/figma-fixture";

describe("fixture audit engines", () => {
  it("finds the documented old web values", async () => { const findings = await scanGithubFixture(resolve("fixtures/nexa-web")); expect(findings).toHaveLength(3); expect(findings.every((finding) => finding.classification === "confirmed" && finding.confidence === 1)).toBe(true); });
  it("finds the documented old Figma values", () => { const snapshot = JSON.parse(readFileSync("fixtures/nexa-figma.json", "utf8")); const findings = scanFigmaFixture(snapshot); expect(findings.map((finding) => finding.expected)).toEqual(expect.arrayContaining(["#2457F5", "Geist", "8px"])); });
});
