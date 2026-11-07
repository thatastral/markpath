import { randomUUID } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import type { AuditFinding } from "./types";

function db() { const database = getDatabase(); initializeSchema(database); return database; }
const now = () => new Date().toISOString();
export const RULE_OF: Record<string, string> = { colour: "primary-colour", typeface: "primary-typeface", radius: "button-radius", contrast: "text-contrast", voice: "brand-voice", logo: "logo-usage", humanReview: "needs-review" };
const FIXABLE = new Set(["colour", "typeface", "radius"]);
const SEVERITY: Record<string, "high" | "medium" | "low"> = { colour: "high", typeface: "medium", radius: "medium", contrast: "medium", voice: "low", logo: "medium", humanReview: "low" };

/** A Figma file or Canva design as a resource row, created on first sight. The same id is used by approvals and verification. */
export function ensureDesignResource(brandId: string, provider: "figma" | "canva", name: string, url?: string) {
  const prefix = provider === "canva" ? "canva-mcp" : "figma-plugin"; const externalId = `${prefix}:${name}`;
  const existing = db().prepare("SELECT id FROM resources WHERE brand_id = ? AND external_resource_id = ?").get(brandId, externalId) as { id: string } | undefined;
  if (existing) return existing.id;
  const integration = db().prepare("SELECT id FROM integrations WHERE brand_id = ? AND provider = ?").get(brandId, provider) as { id: string } | undefined;
  const id = randomUUID();
  db().prepare(`INSERT INTO resources (id, brand_id, integration_id, resource_type, external_resource_id, resource_name, resource_url, last_inspected_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'audited', ?)`).run(id, brandId, integration?.id ?? null, provider === "canva" ? "canva_design" : "figma_file", externalId, name, url ?? null, now(), now());
  return id;
}

export type DesignItem = { property: string; nodeName: string; detected: string; expected: string; evidence?: string; confidence?: number };
/** Replaces the open issues on one resource with the latest result, so repeated checks never pile up duplicates. Judgement items are kept apart as "needs review". */
export function replaceDesignFindings(brandId: string, resourceId: string, items: DesignItem[]) {
  const database = db();
  database.transaction(() => {
    database.prepare("DELETE FROM findings WHERE resource_id = ? AND status = 'open'").run(resourceId);
    const insert = database.prepare(`INSERT INTO findings (id, brand_id, resource_id, rule_id, detected_value, expected_value, severity, confidence, evidence, recommended_action, classification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`);
    for (const it of items.slice(0, 200)) {
      const fixable = FIXABLE.has(it.property);
      insert.run(randomUUID(), brandId, resourceId, RULE_OF[it.property] ?? "needs-review", it.detected.slice(0, 120), it.expected.slice(0, 160), SEVERITY[it.property] ?? "low", it.confidence ?? (fixable || it.property === "contrast" ? 1 : 0.6), (it.evidence ?? `${it.nodeName}: ${it.detected}`).slice(0, 300), fixable ? `Change ${it.nodeName} to ${it.expected}.` : "A person should review this and decide.", fixable ? "confirmed" : "needs_review", now());
    }
  })();
  database.prepare("UPDATE resources SET last_inspected_at = ?, status = 'audited' WHERE id = ?").run(now(), resourceId);
}

/** Same idea for deterministic audit results (repository scans). */
export function replaceAuditFindings(brandId: string, resourceId: string, findings: AuditFinding[]) {
  const database = db();
  database.transaction(() => {
    database.prepare("DELETE FROM findings WHERE resource_id = ? AND status = 'open'").run(resourceId);
    const insert = database.prepare(`INSERT INTO findings (id, brand_id, resource_id, rule_id, detected_value, expected_value, severity, confidence, evidence, recommended_action, classification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`);
    for (const f of findings) insert.run(randomUUID(), brandId, resourceId, f.ruleId, f.detected, f.expected, f.severity, f.confidence, f.evidence, f.recommendedAction, f.classification, now());
  })();
  database.prepare("UPDATE resources SET last_inspected_at = ?, status = 'audited' WHERE id = ?").run(now(), resourceId);
}

/** After QA verifies a task, its confirmed issues are resolved. Items that needed a person stay open. */
export function resolveTaskFindings(taskId: string) {
  db().prepare("UPDATE findings SET status = 'resolved' WHERE classification = 'confirmed' AND status = 'open' AND resource_id IN (SELECT resource_id FROM task_resources WHERE task_id = ?)").run(taskId);
}
