/** WCAG 2.x contrast. Deterministic, so a model never has to do this arithmetic. */
const channel = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim()); if (!m) throw new Error(`Not a 6-digit hex colour: ${hex}`);
  const n = parseInt(m[1], 16); return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrastRatio(a: string, b: string) { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); }
/** Large text is 24px and up, or 18.66px and up when bold (WCAG's 18pt and 14pt bold). */
export const isLargeText = (fontSize?: number, bold?: boolean) => fontSize !== undefined && (fontSize >= 24 || (Boolean(bold) && fontSize >= 18.66));
export type ContrastPair = { label: string; foreground: string; background: string; fontSize?: number; bold?: boolean };
export function checkContrast(pairs: ContrastPair[], thresholds: { normal: number; large: number }) {
  const results = pairs.map((p) => {
    try { const ratio = contrastRatio(p.foreground, p.background); const large = isLargeText(p.fontSize, p.bold); const needed = large ? thresholds.large : thresholds.normal; return { label: p.label, foreground: p.foreground, background: p.background, ratio: Math.round(ratio * 100) / 100, needed, large, passes: ratio >= needed }; }
    catch (e) { return { label: p.label, foreground: p.foreground, background: p.background, ratio: null, needed: thresholds.normal, large: false, passes: null, error: e instanceof Error ? e.message : "bad colour" }; }
  });
  return { checked: results.length, failing: results.filter((r) => r.passes === false).length, unmeasurable: results.filter((r) => r.passes === null).length, results: results.filter((r) => r.passes !== true) };
}
