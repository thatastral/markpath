import type Database from "better-sqlite3";

const initialized = new WeakSet<object>();
/** Creates or upgrades the tables once per connection (a remote database would otherwise pay for it on every call). */
export function initializeSchema(db: Database.Database) {
  if (initialized.has(db)) return;
  initialized.add(db);
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
    CREATE TABLE IF NOT EXISTS brand_guidelines (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL, storage_path TEXT NOT NULL, content_type TEXT NOT NULL,
      extraction_mode TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS brand_spec_versions (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      guideline_id TEXT REFERENCES brand_guidelines(id) ON DELETE SET NULL,
      version TEXT NOT NULL, specification TEXT NOT NULL, status TEXT NOT NULL,
      source_type TEXT NOT NULL, created_by TEXT REFERENCES users(id), created_at TEXT NOT NULL,
      approved_at TEXT, approved_by TEXT REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS task_resources (
      id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      status TEXT NOT NULL, required INTEGER NOT NULL DEFAULT 1,
      verification_evidence TEXT, error TEXT, created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, UNIQUE(task_id, resource_id)
    );
    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      role TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, revoked_at TEXT
    );
    CREATE TABLE IF NOT EXISTS chat_identities (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, handle TEXT NOT NULL,
      created_at TEXT NOT NULL, UNIQUE(brand_id, handle)
    );
    CREATE TABLE IF NOT EXISTS integration_secrets (
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE, provider TEXT NOT NULL,
      secret_enc TEXT NOT NULL, meta TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL,
      PRIMARY KEY (brand_id, provider)
    );
    CREATE TABLE IF NOT EXISTS vet_reports (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      kind TEXT NOT NULL, target TEXT NOT NULL, verdict TEXT NOT NULL, summary TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pr_checks (
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE, repo TEXT NOT NULL, number INTEGER NOT NULL, head_sha TEXT NOT NULL,
      findings INTEGER NOT NULL, commented INTEGER NOT NULL DEFAULT 0, checked_at TEXT NOT NULL, PRIMARY KEY (brand_id, repo, number, head_sha)
    );
    CREATE TABLE IF NOT EXISTS brand_assets (
      id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE, kind TEXT NOT NULL,
      filename TEXT NOT NULL, storage_path TEXT NOT NULL, content_type TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_vet_reports_brand ON vet_reports(brand_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_api_tokens_brand ON api_tokens(brand_id, role);
    CREATE INDEX IF NOT EXISTS idx_memberships_brand ON memberships(brand_id);
    CREATE INDEX IF NOT EXISTS idx_resources_brand ON resources(brand_id);
    CREATE INDEX IF NOT EXISTS idx_findings_resource ON findings(resource_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_brand ON tasks(brand_id, status);
    CREATE INDEX IF NOT EXISTS idx_approvals_binding ON approvals(task_id, resource_id, operation_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_execution_task ON execution_records(task_id);
    CREATE INDEX IF NOT EXISTS idx_activity_brand ON agent_activity(brand_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_brand_spec_versions_brand ON brand_spec_versions(brand_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_task_resources_task ON task_resources(task_id, status);
  `);
  const approvalColumns = db.prepare("PRAGMA table_info(approvals)").all() as Array<{ name: string }>;
  if (!approvalColumns.some((column) => column.name === "consumed_at")) db.exec("ALTER TABLE approvals ADD COLUMN consumed_at TEXT");
  for (const column of ["decision_channel", "decision_ref"]) if (!approvalColumns.some((c) => c.name === column)) db.exec(`ALTER TABLE approvals ADD COLUMN ${column} TEXT`);
  const brandColumns = db.prepare("PRAGMA table_info(brands)").all() as Array<{ name: string }>;
  if (!brandColumns.some((c) => c.name === "team_prefix")) db.exec("ALTER TABLE brands ADD COLUMN team_prefix TEXT NOT NULL DEFAULT 'markpath'");
  const tokenColumns = db.prepare("PRAGMA table_info(api_tokens)").all() as Array<{ name: string }>;
  if (!tokenColumns.some((column) => column.name === "token_enc")) db.exec("ALTER TABLE api_tokens ADD COLUMN token_enc TEXT");
  const assetColumns = db.prepare("PRAGMA table_info(brand_assets)").all() as Array<{ name: string }>;
  if (!assetColumns.some((column) => column.name === "data_base64")) db.exec("ALTER TABLE brand_assets ADD COLUMN data_base64 TEXT");
}
