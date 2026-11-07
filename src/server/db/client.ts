import type BetterSqlite from "better-sqlite3";
import Libsql from "libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// libsql is a better-sqlite3 compatible driver. Locally it opens a SQLite file; on a host without a
// persistent disk (Vercel) it talks to a Turso database when TURSO_DATABASE_URL is set.
type Db = BetterSqlite.Database;
const databases = new Map<string, Db>();

// On Vercel without Turso (preview deployments) the only writable place is /tmp: data there is temporary.
export function databasePath(path = process.env.MARKPATH_DB_PATH ?? (process.env.VERCEL ? "/tmp/markpath.sqlite" : "./data/markpath.sqlite")) {
  return resolve(/* turbopackIgnore: true */ process.cwd(), path);
}

export function remoteDatabaseUrl() {
  return process.env.TURSO_DATABASE_URL?.trim() || process.env.LIBSQL_URL?.trim() || "";
}

export function getDatabase(path?: string) {
  const remote = path ? "" : remoteDatabaseUrl();
  const key = remote || databasePath(path);
  const existing = databases.get(key);
  if (existing) return existing;
  let db: Db;
  if (remote) {
    db = new Libsql(remote, { authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.LIBSQL_AUTH_TOKEN } as Record<string, unknown>) as unknown as Db;
  } else {
    mkdirSync(dirname(key), { recursive: true });
    db = new Libsql(key) as unknown as Db;
    db.pragma("journal_mode = WAL");
  }
  db.pragma("foreign_keys = ON");
  db = compatible(db);
  databases.set(key, db);
  return db;
}

export function closeDatabase(path?: string) {
  const key = path ? databasePath(path) : remoteDatabaseUrl() || databasePath();
  const db = databases.get(key);
  if (db) {
    db.close();
    databases.delete(key);
  }
}

/** Makes libsql behave like better-sqlite3 where the app relies on it: plain row objects (libsql adds a
 * `_metadata` key) and nested transactions (better-sqlite3 uses savepoints; libsql refuses). */
function compatible(raw: Db): Db {
  const clean = <T>(row: T): T => { if (row && typeof row === "object" && "_metadata" in row) delete (row as Record<string, unknown>)._metadata; return row; };
  const prepare = raw.prepare.bind(raw);
  let depth = 0; let seq = 0;
  const wrapper = Object.create(raw) as Db;
  Object.assign(wrapper, {
    prepare(sql: string) {
      // Named parameters (@name) are rewritten to positional ones: the remote (Turso) protocol drops named object bindings.
      const names: string[] = [];
      const positional = sql.replace(/(?<![\w'"])@([A-Za-z_][A-Za-z0-9_]*)/g, (_m, name: string) => { names.push(name); return "?"; });
      const stmt = prepare(names.length ? positional : sql);
      const bind = (args: unknown[]) => (names.length && args.length === 1 && args[0] && typeof args[0] === "object" && !Array.isArray(args[0]) ? names.map((n) => (args[0] as Record<string, unknown>)[n] ?? null) : args);
      return new Proxy(stmt, { get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (prop === "get") return (...args: unknown[]) => clean((value as (...a: unknown[]) => unknown).apply(target, bind(args)));
        if (prop === "all") return (...args: unknown[]) => ((value as (...a: unknown[]) => unknown[]).apply(target, bind(args))).map(clean);
        if (prop === "run") return (...args: unknown[]) => (value as (...a: unknown[]) => unknown).apply(target, bind(args));
        return typeof value === "function" ? value.bind(target) : value;
      } });
    },
    transaction<F extends (...args: never[]) => unknown>(fn: F) {
      return ((...args: Parameters<F>) => {
        const name = `mp_sp_${++seq}`; const outer = depth === 0;
        raw.exec(outer ? "BEGIN" : `SAVEPOINT ${name}`); depth++;
        try {
          const result = fn(...args);
          depth--; raw.exec(outer ? "COMMIT" : `RELEASE ${name}`);
          return result;
        } catch (error) {
          depth--; raw.exec(outer ? "ROLLBACK" : `ROLLBACK TO ${name}; RELEASE ${name}`);
          throw error;
        }
      }) as unknown as BetterSqlite.Transaction<F>;
    },
    pragma: raw.pragma.bind(raw), exec: raw.exec.bind(raw), close: raw.close.bind(raw),
  });
  return wrapper;
}
