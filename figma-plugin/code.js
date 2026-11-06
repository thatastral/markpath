// Markpath Figma plugin: sandbox side. Inspects the current page and applies ONLY changes the Markpath backend returned as approved.
// Limits: current page only, solid fills, text fonts, corner radius, local COLOR variables. Not an unattended service.
figma.showUI(__html__, { width: 400, height: 600 });

const toHex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const fromHex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const px = (value) => Number.parseFloat(String(value));

async function scan(legacy) {
  const found = { fill: [], font: [], radius: [], variable: [] };
  for (const node of figma.currentPage.findAll()) {
    if ("fills" in node && Array.isArray(node.fills)) {
      node.fills.forEach((paint, index) => { if (paint.type === "SOLID" && toHex(paint.color) === legacy.primaryColour.toUpperCase()) found.fill.push({ node, index }); });
    }
    if (node.type === "TEXT" && node.fontName !== figma.mixed && node.fontName.family === legacy.primaryTypeface) found.font.push({ node });
    if ("cornerRadius" in node && typeof node.cornerRadius === "number" && node.cornerRadius === px(legacy.buttonRadius)) found.radius.push({ node });
  }
  for (const variable of await figma.variables.getLocalVariablesAsync("COLOR")) {
    for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
      if (value && typeof value === "object" && "r" in value && toHex(value) === legacy.primaryColour.toUpperCase()) found.variable.push({ variable, modeId });
    }
  }
  return found;
}
const summarise = (found) => ({ fill: found.fill.length, font: found.font.length, radius: found.radius.length, variable: found.variable.length });
const describe = (found, expected, legacy) => [
  ...found.fill.map((f) => ({ nodeName: f.node.name, property: "fill", detected: legacy.primaryColour, expected: expected.primaryColour })),
  ...found.font.map((f) => ({ nodeName: f.node.name, property: "font", detected: legacy.primaryTypeface, expected: expected.primaryTypeface })),
  ...found.radius.map((f) => ({ nodeName: f.node.name, property: "radius", detected: legacy.buttonRadius, expected: expected.buttonRadius })),
  ...found.variable.map((f) => ({ nodeName: f.variable.name, property: "variable", detected: legacy.primaryColour, expected: expected.primaryColour })),
];

async function apply(expected, legacy) {
  const found = await scan(legacy);
  const before = summarise(found);
  const failures = [];
  for (const { node, index } of found.fill) { const fills = JSON.parse(JSON.stringify(node.fills)); fills[index].color = fromHex(expected.primaryColour); node.fills = fills; }
  for (const { node } of found.radius) node.cornerRadius = px(expected.buttonRadius);
  for (const { variable, modeId } of found.variable) { try { variable.setValueForMode(modeId, { ...fromHex(expected.primaryColour), a: 1 }); } catch (e) { failures.push(`variable ${variable.name}: ${e.message}`); } }
  for (const { node } of found.font) {
    try { const next = { family: expected.primaryTypeface, style: node.fontName.style }; await figma.loadFontAsync(next); node.fontName = next; }
    catch (e) { failures.push(`font on "${node.name}": ${expected.primaryTypeface} is not available (${e.message})`); }
  }
  const after = summarise(await scan(legacy));
  return { before, after, remaining: Object.values(after).reduce((a, b) => a + b, 0), failures };
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "inspect") {
      const found = await scan(msg.legacy);
      figma.ui.postMessage({ type: "findings", fileName: figma.root.name, summary: summarise(found), findings: describe(found, msg.expected, msg.legacy).slice(0, 500) });
    } else if (msg.type === "apply") {
      const result = await apply(msg.expected, msg.legacy);
      figma.ui.postMessage({ type: "applied", approvalId: msg.approvalId, ...result });
    }
  } catch (error) { figma.ui.postMessage({ type: "error", message: String(error && error.message ? error.message : error) }); }
};
