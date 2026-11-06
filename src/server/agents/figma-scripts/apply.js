// Applies ONLY the approved brand change (legacy -> expected) to the current Figma file. CONFIG is substituted by Markpath. Changes nothing else.
const C = CONFIG;
const toRgb = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const hexOf = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const from = C.from, to = C.to; // from = legacy values, to = expected values
const fromHex = from.primaryColour.toUpperCase(); const fromRadius = parseFloat(from.buttonRadius); const toRadius = parseFloat(to.buttonRadius);
const norm = (s) => s.replace(/\s+/g, "").toLowerCase();
const available = (await figma.listAvailableFontsAsync()).filter((f) => f.fontName.family === to.primaryTypeface).map((f) => f.fontName);
const mapFont = (style) => available.find((f) => norm(f.style) === norm(style)) ?? available.find((f) => norm(f.style) === "regular");
if (!available.length) throw new Error(to.primaryTypeface + " is not available in Figma, so the typeface cannot be changed.");
// Load every legacy font in use so text can be touched, then the target fonts.
const legacyFonts = new Map();
const note = (f) => legacyFonts.set(f.family + "|" + f.style, f);
for (const s of await figma.getLocalTextStylesAsync()) if (s.fontName.family === from.primaryTypeface) note(s.fontName);
for (const page of figma.root.children) { await figma.setCurrentPageAsync(page); for (const t of page.findAll((n) => n.type === "TEXT")) if (t.fontName !== figma.mixed && t.fontName.family === from.primaryTypeface) note(t.fontName); }
for (const f of legacyFonts.values()) await figma.loadFontAsync(f);
for (const f of available) await figma.loadFontAsync(f);
const changed = { variables: [], paintStyles: [], textStyles: [], nodes: [] };
for (const v of await figma.variables.getLocalVariablesAsync()) for (const [mode, val] of Object.entries(v.valuesByMode)) {
  if (v.resolvedType === "COLOR" && val && typeof val === "object" && "r" in val && hexOf(val) === fromHex) { v.setValueForMode(mode, { ...toRgb(to.primaryColour), a: 1 }); changed.variables.push(v.id); }
  if (v.resolvedType === "FLOAT" && v.scopes.includes("CORNER_RADIUS") && val === fromRadius) { v.setValueForMode(mode, toRadius); changed.variables.push(v.id); }
}
for (const s of await figma.getLocalPaintStylesAsync()) if (s.paints.some((p) => p.type === "SOLID" && hexOf(p.color) === fromHex)) { s.paints = s.paints.map((p) => (p.type === "SOLID" && hexOf(p.color) === fromHex ? { ...p, color: toRgb(to.primaryColour) } : p)); changed.paintStyles.push(s.id); }
for (const s of await figma.getLocalTextStylesAsync()) if (s.fontName.family === from.primaryTypeface) { s.fontName = mapFont(s.fontName.style); changed.textStyles.push(s.id); }
for (const page of figma.root.children) {
  await figma.setCurrentPageAsync(page);
  for (const n of page.findAll(() => true)) {
    if ("fills" in n && Array.isArray(n.fills) && !n.fillStyleId && n.fills.some((p) => p.type === "SOLID" && hexOf(p.color) === fromHex && !(p.boundVariables && p.boundVariables.color))) { n.fills = n.fills.map((p) => (p.type === "SOLID" && hexOf(p.color) === fromHex && !(p.boundVariables && p.boundVariables.color) ? { ...p, color: toRgb(to.primaryColour) } : p)); changed.nodes.push(n.id); }
    if (n.type === "TEXT" && n.fontName !== figma.mixed && n.fontName.family === from.primaryTypeface && !n.textStyleId) { n.fontName = mapFont(n.fontName.style); changed.nodes.push(n.id); }
    if ("cornerRadius" in n && typeof n.cornerRadius === "number" && n.cornerRadius === fromRadius && !(n.boundVariables && n.boundVariables.topLeftRadius)) { n.cornerRadius = toRadius; changed.nodes.push(n.id); }
  }
}
return { changedCounts: { variables: changed.variables.length, paintStyles: changed.paintStyles.length, textStyles: changed.textStyles.length, nodes: changed.nodes.length }, changedNodeIds: [...new Set(changed.nodes)].slice(0, 60), changedVariableIds: changed.variables };
