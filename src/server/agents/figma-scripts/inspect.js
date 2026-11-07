// Read-only. Finds outdated brand values in the current Figma file. CONFIG is substituted by Markpath.
const C = CONFIG;
const hexOf = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const legacyHex = C.legacy.primaryColour.toUpperCase(); const legacyRadius = parseFloat(C.legacy.buttonRadius); const legacyFont = C.legacy.primaryTypeface;
const out = { variables: [], paintStyles: [], textStyles: [], nodes: [] };
const contrastPairs = []; const texts = [];
const solidOf = (paints) => { if (!Array.isArray(paints)) return null; const p = paints.find((x) => x.type === "SOLID" && x.visible !== false && (x.opacity === undefined || x.opacity >= 0.99)); return p ? hexOf(p.color) : null; };
for (const v of await figma.variables.getLocalVariablesAsync()) {
  for (const [mode, val] of Object.entries(v.valuesByMode)) {
    if (v.resolvedType === "COLOR" && val && typeof val === "object" && "r" in val && hexOf(val) === legacyHex) out.variables.push({ id: v.id, name: v.name, kind: "colour" });
    if (v.resolvedType === "FLOAT" && v.scopes.includes("CORNER_RADIUS") && val === legacyRadius) out.variables.push({ id: v.id, name: v.name, kind: "radius" });
  }
}
for (const s of await figma.getLocalPaintStylesAsync()) if (s.paints.some((p) => p.type === "SOLID" && hexOf(p.color) === legacyHex)) out.paintStyles.push({ id: s.id, name: s.name });
for (const s of await figma.getLocalTextStylesAsync()) if (s.fontName.family === legacyFont) out.textStyles.push({ id: s.id, name: s.name });
for (const page of figma.root.children) {
  await figma.setCurrentPageAsync(page);
  for (const n of page.findAll(() => true)) {
    if ("fills" in n && Array.isArray(n.fills)) n.fills.forEach((p) => { if (p.type === "SOLID" && hexOf(p.color) === legacyHex && !(p.boundVariables && p.boundVariables.color) && !n.fillStyleId) out.nodes.push({ id: n.id, name: n.name, kind: "colour" }); });
    if (n.type === "TEXT" && n.fontName !== figma.mixed && n.fontName.family === legacyFont && !n.textStyleId) out.nodes.push({ id: n.id, name: n.name, kind: "typeface" });
    if (n.type === "TEXT") {
      const fg = n.fills !== figma.mixed ? solidOf(n.fills) : null; let bg = null; let parent = n.parent;
      while (parent && !bg) { if ("fills" in parent && parent.fills !== figma.mixed) bg = solidOf(parent.fills); parent = parent.parent; }
      if (fg) contrastPairs.push({ label: n.characters.slice(0, 40), foreground: fg, background: bg || "#FFFFFF", fontSize: typeof n.fontSize === "number" ? n.fontSize : undefined, bold: n.fontName !== figma.mixed && /bold|black|extra/i.test(n.fontName.style) });
      if (n.characters.trim()) texts.push({ id: n.id, text: n.characters.slice(0, 160) });
    }
    if ("cornerRadius" in n && typeof n.cornerRadius === "number" && n.cornerRadius === legacyRadius && !(n.boundVariables && n.boundVariables.topLeftRadius)) out.nodes.push({ id: n.id, name: n.name, kind: "radius" });
  }
}
const count = (list, kind) => list.filter((x) => x.kind === kind).length;
return { fileName: figma.root.name, counts: { colour: count(out.variables, "colour") + out.paintStyles.length + count(out.nodes, "colour"), typeface: out.textStyles.length + count(out.nodes, "typeface"), radius: count(out.variables, "radius") + count(out.nodes, "radius") }, total: out.variables.length + out.paintStyles.length + out.textStyles.length + out.nodes.length, contrastPairs: contrastPairs.slice(0, 150), texts: texts.slice(0, 80), ...out };
