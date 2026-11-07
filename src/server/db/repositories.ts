import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

export type UserRecord = { id: string; email: string; name: string; password_hash: string; created_at: string };
export type BrandRecord = { id: string; name: string; description: string; brand_specification: string; brand_version: string };
export type BrandSpecVersionRecord = { id: string; brand_id: string; guideline_id: string | null; version: string; specification: string; status: "extracted" | "approved"; source_type: string; created_at: string; approved_at: string | null };

const now = () => new Date().toISOString();

export function createUser(db: Database.Database, input: Omit<UserRecord, "id" | "created_at">) {
  const user = { id: randomUUID(), created_at: now(), ...input };
  db.prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (@id, @email, @name, @password_hash, @created_at)").run(user);
  return user;
}

export function findUserByEmail(db: Database.Database, email: string) {
  return db.prepare("SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?").get(email.toLowerCase()) as UserRecord | undefined;
}

export function findUserById(db: Database.Database, id: string) {
  return db.prepare("SELECT id, email, name, password_hash, created_at FROM users WHERE id = ?").get(id) as UserRecord | undefined;
}

export function createBrand(db: Database.Database, input: { name: string; description: string; approvalOwner: string }) {
  const record = { id: randomUUID(), name: input.name, description: input.description, approval_owner: input.approvalOwner, created_at: now(), updated_at: now() };
  db.prepare("INSERT INTO brands (id, name, description, approval_owner, created_at, updated_at) VALUES (@id, @name, @description, @approval_owner, @created_at, @updated_at)").run(record);
  return record;
}

export function addMembership(db: Database.Database, userId: string, brandId: string, role: "owner" | "member") {
  db.prepare("INSERT OR IGNORE INTO memberships (id, user_id, brand_id, role, created_at) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), userId, brandId, role, now());
}

export function findFirstBrandForUser(db: Database.Database, userId: string) {
  return db.prepare(`SELECT b.id, b.name, b.description, b.brand_specification, b.brand_version
    FROM brands b JOIN memberships m ON m.brand_id = b.id WHERE m.user_id = ? ORDER BY b.created_at LIMIT 1`).get(userId) as BrandRecord | undefined;
}

export function findBrandForUser(db: Database.Database, brandId: string, userId: string) {
  return db.prepare(`SELECT b.id, b.name, b.description, b.brand_specification, b.brand_version FROM brands b
    JOIN memberships m ON m.brand_id = b.id WHERE b.id = ? AND m.user_id = ?`).get(brandId, userId) as BrandRecord | undefined;
}

export function addGuideline(db: Database.Database, input: { brandId: string; originalName: string; storagePath: string; contentType: string; extractionMode: string }) {
  const record = { id: randomUUID(), brand_id: input.brandId, original_name: input.originalName, storage_path: input.storagePath, content_type: input.contentType, extraction_mode: input.extractionMode, created_at: now() };
  db.prepare(`INSERT INTO brand_guidelines (id, brand_id, original_name, storage_path, content_type, extraction_mode, created_at)
    VALUES (@id, @brand_id, @original_name, @storage_path, @content_type, @extraction_mode, @created_at)`).run(record);
  return record;
}

export function addBrandSpecVersion(db: Database.Database, input: { brandId: string; guidelineId: string; version: string; specification: string; sourceType: string; createdBy: string }) {
  const record = { id: randomUUID(), brand_id: input.brandId, guideline_id: input.guidelineId, version: input.version, specification: input.specification, status: "extracted", source_type: input.sourceType, created_by: input.createdBy, created_at: now() };
  db.prepare(`INSERT INTO brand_spec_versions (id, brand_id, guideline_id, version, specification, status, source_type, created_by, created_at)
    VALUES (@id, @brand_id, @guideline_id, @version, @specification, @status, @source_type, @created_by, @created_at)`).run(record);
  return record;
}

export function listBrandSpecVersions(db: Database.Database, brandId: string) {
  return db.prepare("SELECT id, brand_id, guideline_id, version, specification, status, source_type, created_at, approved_at FROM brand_spec_versions WHERE brand_id = ? ORDER BY created_at DESC").all(brandId) as BrandSpecVersionRecord[];
}

export function approveBrandSpecVersion(db: Database.Database, input: { id: string; brandId: string; userId: string }) {
  const version = db.prepare("SELECT id, version, specification FROM brand_spec_versions WHERE id = ? AND brand_id = ?").get(input.id, input.brandId) as { id: string; version: string; specification: string } | undefined;
  if (!version) return false;
  const timestamp = now();
  const transaction = db.transaction(() => {
    db.prepare("UPDATE brand_spec_versions SET status = 'superseded' WHERE brand_id = ? AND status = 'approved' AND id != ?").run(input.brandId, version.id); // only one version is in force
    db.prepare("UPDATE brand_spec_versions SET status = 'approved', approved_at = ?, approved_by = ? WHERE id = ?").run(timestamp, input.userId, version.id);
    const who = (db.prepare("SELECT name FROM users WHERE id = ?").get(input.userId) as { name: string } | undefined)?.name ?? "A person";
    db.prepare("INSERT INTO agent_activity (id, brand_id, task_id, agent_name, activity_type, message_reference, status, created_at) VALUES (?, ?, NULL, ?, 'brand_rules_approved', NULL, ?, ?)").run(randomUUID(), input.brandId, who, `approved brand rules v${version.version}`, timestamp);
    db.prepare("UPDATE brands SET brand_specification = ?, brand_version = ?, updated_at = ? WHERE id = ?").run(version.specification, version.version, timestamp, input.brandId);
  });
  transaction();
  return true;
}

export function createIntegrationPlaceholder(db: Database.Database, brandId: string, provider: "github" | "figma" | "canva" | "switch", mode: string) {
  db.prepare(`INSERT OR IGNORE INTO integrations (id, brand_id, provider, connection_status, permissions, mode, created_at)
    VALUES (?, ?, ?, 'not_connected', '[]', ?, ?)`).run(randomUUID(), brandId, provider, mode, now());
}

export function listIntegrations(db: Database.Database, brandId: string) {
  return db.prepare("SELECT provider, connection_status, mode, last_checked_at FROM integrations WHERE brand_id = ? ORDER BY provider").all(brandId) as Array<{ provider: string; connection_status: string; mode: string; last_checked_at: string | null }>;
}
