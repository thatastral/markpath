import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import type { AuditFinding } from "./types";

const rules = [
  { id: "primary-colour", old: "#164B9B", expected: "#2457F5", label: "primary colour" },
  { id: "primary-typeface", old: "Inter", expected: "Geist", label: "primary typeface" },
  { id: "button-radius", old: "4px", expected: "8px", label: "button radius" }
];
async function files(directory: string): Promise<string[]> { const entries = await readdir(directory, { withFileTypes: true }); return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]))).flat(); }

export async function scanGithubFixture(root: string): Promise<AuditFinding[]> {
  const results: AuditFinding[] = [];
  for (const file of await files(root)) {
    const content = await readFile(file, "utf8"); const location = relative(root, file);
    for (const rule of rules) if (content.includes(rule.old)) results.push({ platform: "github", location, ruleId: rule.id, detected: rule.old, expected: rule.expected, evidence: `Fixture file ${location} contains ${rule.old}.`, severity: rule.id === "primary-colour" ? "high" : "medium", confidence: 1, classification: "confirmed", recommendedAction: `Replace ${rule.label} with ${rule.expected}.` });
  }
  return results;
}
