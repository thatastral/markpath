import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

export type UserRecord = { id: string; email: string; name: string; password_hash: string; created_at: string };
export type BrandRecord = { id: string; name: string; description: string; brand_specification: string; brand_version: string };

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

export function createIntegrationPlaceholder(db: Database.Database, brandId: string, provider: "github" | "figma" | "canva" | "switch", mode: string) {
  db.prepare(`INSERT OR IGNORE INTO integrations (id, brand_id, provider, connection_status, permissions, mode, created_at)
    VALUES (?, ?, ?, 'not_connected', '[]', ?, ?)`).run(randomUUID(), brandId, provider, mode, now());
}

export function listIntegrations(db: Database.Database, brandId: string) {
  return db.prepare("SELECT provider, connection_status, mode, last_checked_at FROM integrations WHERE brand_id = ? ORDER BY provider").all(brandId) as Array<{ provider: string; connection_status: string; mode: string; last_checked_at: string | null }>;
}
