import type Database from "better-sqlite3";

export function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
      brand_specification TEXT NOT NULL DEFAULT '{}', brand_version TEXT NOT NULL DEFAULT '0.0',
      approval_owner TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE, role TEXT NOT NULL,
      created_at TEXT NOT NULL, UNIQUE(user_id, brand_id)
    );
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      provider TEXT NOT NULL, connection_status TEXT NOT NULL, external_account_id TEXT,
      permissions TEXT NOT NULL DEFAULT '[]', mode TEXT NOT NULL DEFAULT 'fixture',
      last_checked_at TEXT, created_at TEXT NOT NULL, UNIQUE(brand_id, provider)
    );
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      integration_id TEXT REFERENCES integrations(id) ON DELETE SET NULL, resource_type TEXT NOT NULL,
      external_resource_id TEXT, resource_name TEXT NOT NULL, resource_url TEXT,
      last_inspected_at TEXT, status TEXT NOT NULL DEFAULT 'uninspected', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      task_type TEXT NOT NULL, description TEXT NOT NULL, initiated_by TEXT REFERENCES users(id),
      assigned_agent TEXT, status TEXT NOT NULL, approval_status TEXT NOT NULL,
      idempotency_key TEXT UNIQUE, created_at TEXT NOT NULL, completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE, rule_id TEXT NOT NULL,
      detected_value TEXT, expected_value TEXT, severity TEXT NOT NULL, confidence REAL NOT NULL,
      evidence TEXT NOT NULL, recommended_action TEXT NOT NULL, classification TEXT NOT NULL,
      status TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      requested_by TEXT, approved_by TEXT REFERENCES users(id), decision TEXT NOT NULL,
      approved_action TEXT NOT NULL, operation_fingerprint TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS execution_records (
      id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      integration_id TEXT REFERENCES integrations(id) ON DELETE SET NULL,
      resource_id TEXT REFERENCES resources(id) ON DELETE SET NULL, operation TEXT NOT NULL,
      result TEXT NOT NULL, evidence TEXT NOT NULL, error TEXT, mode TEXT NOT NULL,
      executed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agent_activity (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL, agent_name TEXT NOT NULL,
      activity_type TEXT NOT NULL, message_reference TEXT, status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_memberships_brand ON memberships(brand_id);
    CREATE INDEX IF NOT EXISTS idx_resources_brand ON resources(brand_id);
    CREATE INDEX IF NOT EXISTS idx_findings_resource ON findings(resource_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_brand ON tasks(brand_id, status);
    CREATE INDEX IF NOT EXISTS idx_approvals_binding ON approvals(task_id, resource_id, operation_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_execution_task ON execution_records(task_id);
    CREATE INDEX IF NOT EXISTS idx_activity_brand ON agent_activity(brand_id, created_at);
  `);
}
