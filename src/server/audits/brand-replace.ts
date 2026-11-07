export type BrandValues = { primaryColour: string; primaryTypeface: string; buttonRadius: string };
export type BrandChange = { property: "colour" | "typeface" | "radius"; detected: string; expected: string; line: number; text: string };

const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function rules(legacy: BrandValues, expected: BrandValues) {
  return ([
    { property: "colour" as const, detected: legacy.primaryColour, expected: expected.primaryColour, regex: new RegExp(esc(legacy.primaryColour), "gi"), replace: () => expected.primaryColour },
    { property: "typeface" as const, detected: legacy.primaryTypeface, expected: expected.primaryTypeface, regex: new RegExp(`((?:font-family|--font[\\w-]*)\\s*:[^;{}\\n]*?)\\b${esc(legacy.primaryTypeface)}\\b`, "gi"), replace: (_m: string, prefix: string) => `${prefix}${expected.primaryTypeface}` },
    { property: "radius" as const, detected: legacy.buttonRadius, expected: expected.buttonRadius, regex: new RegExp(`((?:border-radius|--radius[\\w-]*)\\s*:\\s*)${esc(legacy.buttonRadius)}(?![\\w.])`, "gi"), replace: (_m: string, prefix: string) => `${prefix}${expected.buttonRadius}` },
  ]).filter((r) => r.detected.trim() !== "" && r.detected.toLowerCase() !== r.expected.toLowerCase()); // no old value given: nothing to look for
}

/** The same patterns drive detection and replacement, so a finding exists exactly when a replacement would change something. */
export function findBrandChanges(content: string, legacy: BrandValues, expected: BrandValues): BrandChange[] {
  const out: BrandChange[] = [];
  content.split(/\r?\n/).forEach((text, index) => { for (const r of rules(legacy, expected)) { r.regex.lastIndex = 0; if (r.regex.test(text)) out.push({ property: r.property, detected: r.detected, expected: r.expected, line: index + 1, text: text.trim().slice(0, 160) }); } });
  return out;
}
export function replaceBrandValues(content: string, legacy: BrandValues, expected: BrandValues) {
  let next = content;
  for (const r of rules(legacy, expected)) next = next.replace(r.regex, r.replace as (substring: string, ...args: string[]) => string);
  return next;
}
