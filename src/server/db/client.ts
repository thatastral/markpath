import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const databases = new Map<string, Database.Database>();

export function databasePath(path = process.env.MARKPATH_DB_PATH ?? "./data/markpath.sqlite") {
  return resolve(/* turbopackIgnore: true */ process.cwd(), path);
}

export function getDatabase(path?: string) {
  const resolved = databasePath(path);
  const existing = databases.get(resolved);
  if (existing) return existing;
  mkdirSync(dirname(resolved), { recursive: true });
  const db = new Database(resolved);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  databases.set(resolved, db);
  return db;
}

export function closeDatabase(path?: string) {
  const resolved = databasePath(path);
  const db = databases.get(resolved);
  if (db) {
    db.close();
    databases.delete(resolved);
  }
}
