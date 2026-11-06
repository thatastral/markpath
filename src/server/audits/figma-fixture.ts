import type { AuditFinding } from "./types";
type Snapshot = { variables?: Array<{ id: string; name: string; value: string }>; styles?: Array<{ id: string; name: string; fontFamily?: string; radius?: string }>; nodes?: Array<{ id: string; name: string; type: string }> };

export function scanFigmaFixture(snapshot: Snapshot): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const variable of snapshot.variables ?? []) if (variable.value === "#164B9B") findings.push({ platform: "figma", location: `Variable ${variable.name}`, ruleId: "primary-colour", detected: variable.value, expected: "#2457F5", evidence: `Fixture variable ${variable.id} has ${variable.value}.`, severity: "high", confidence: 1, classification: "confirmed", recommendedAction: "Update the variable to #2457F5." });
  for (const style of snapshot.styles ?? []) {
    if (style.fontFamily === "Inter") findings.push({ platform: "figma", location: `Style ${style.name}`, ruleId: "primary-typeface", detected: style.fontFamily, expected: "Geist", evidence: `Fixture style ${style.id} has Inter.`, severity: "medium", confidence: 1, classification: "confirmed", recommendedAction: "Update the text style to Geist if the font is available." });
    if (style.radius === "4px") findings.push({ platform: "figma", location: `Style ${style.name}`, ruleId: "button-radius", detected: style.radius, expected: "8px", evidence: `Fixture style ${style.id} has a 4px radius.`, severity: "medium", confidence: 1, classification: "confirmed", recommendedAction: "Update the component radius to 8px." });
  }
  return findings;
}
