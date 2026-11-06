import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { decryptSecret, encryptSecret } from "@/server/crypto/secrets";

function db() { const database = getDatabase(); initializeSchema(database); return database; }
export function saveIntegrationSecret(brandId: string, provider: string, secret: string, meta: Record<string, unknown> = {}) {
  db().prepare(`INSERT INTO integration_secrets (brand_id, provider, secret_enc, meta, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(brand_id, provider) DO UPDATE SET secret_enc = excluded.secret_enc, meta = excluded.meta, updated_at = excluded.updated_at`).run(brandId, provider, encryptSecret(secret), JSON.stringify(meta), new Date().toISOString());
}
export function getIntegrationSecret(brandId: string, provider: string) {
  const row = db().prepare("SELECT secret_enc, meta FROM integration_secrets WHERE brand_id = ? AND provider = ?").get(brandId, provider) as { secret_enc: string; meta: string } | undefined;
  const secret = row ? decryptSecret(row.secret_enc) : null;
  return row && secret ? { secret, meta: JSON.parse(row.meta) as Record<string, unknown> } : null;
}
export function updateIntegrationMeta(brandId: string, provider: string, meta: Record<string, unknown>) {
  db().prepare("UPDATE integration_secrets SET meta = ?, updated_at = ? WHERE brand_id = ? AND provider = ?").run(JSON.stringify(meta), new Date().toISOString(), brandId, provider);
}
export function deleteIntegrationSecret(brandId: string, provider: string) { db().prepare("DELETE FROM integration_secrets WHERE brand_id = ? AND provider = ?").run(brandId, provider); }
