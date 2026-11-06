import { z } from "zod";

export const brandRuleSchema = z.object({
  id: z.string(), category: z.enum(["colour", "typography", "component", "logo"]), label: z.string(), expected: z.string(),
  sourceReference: z.string(), status: z.enum(["extracted", "manual", "approved"])
});
export const brandSpecSchema = z.object({
  brandName: z.string(), version: z.string(), extractionMode: z.literal("fixture extraction"),
  rules: z.array(brandRuleSchema)
});
export type BrandSpec = z.infer<typeof brandSpecSchema>;

function lineReference(contents: string, value: string) {
  const line = contents.split(/\r?\n/).findIndex((entry) => entry.includes(value));
  return line === -1 ? "Source location unavailable" : `Guideline line ${line + 1}`;
}

function capture(contents: string, expression: RegExp) { return expression.exec(contents)?.[1]?.trim(); }

export function extractFixtureBrandSpec(contents: string, brandName = "Nexa"): BrandSpec {
  const version = capture(contents, /version\s+([\d.]+)/i) ?? "unversioned";
  const primaryBlue = capture(contents, /Primary (?:blue|colour|color):\s*`?(#[0-9a-fA-F]{6})`?/i);
  const typeface = capture(contents, /Primary (?:typeface|font):\s*`?([A-Za-z][A-Za-z -]*)`?/i);
  const radius = capture(contents, /Button radius:\s*`?([\d.]+px)`?/i);
  const logoRule = capture(contents, /(Use the approved[^.]+\.)/i);
  const rules: BrandSpec["rules"] = [];
  if (primaryBlue) rules.push({ id: "primary-colour", category: "colour", label: "Primary blue", expected: primaryBlue.toUpperCase(), sourceReference: lineReference(contents, primaryBlue), status: "extracted" });
  if (typeface) rules.push({ id: "primary-typeface", category: "typography", label: "Primary typeface", expected: typeface, sourceReference: lineReference(contents, typeface), status: "extracted" });
  if (radius) rules.push({ id: "button-radius", category: "component", label: "Button radius", expected: radius, sourceReference: lineReference(contents, radius), status: "extracted" });
  if (logoRule) rules.push({ id: "logo-usage", category: "logo", label: "Logo usage", expected: logoRule, sourceReference: lineReference(contents, logoRule), status: "extracted" });
  return brandSpecSchema.parse({ brandName, version, extractionMode: "fixture extraction", rules });
}
