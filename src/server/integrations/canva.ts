import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";

function db() { const database = getDatabase(); initializeSchema(database); return database; }
export const parseCanvaDesignId = (input: string) => /canva\.com\/design\/([A-Za-z0-9_-]{8,})/.exec(input.trim())?.[1] ?? (/^D[A-Za-z0-9_-]{8,}$/.test(input.trim()) ? input.trim() : null);

/** The Canva design this workspace audits through the Canva MCP, if one is configured. */
export function canvaMcpConfig(brandId: string) {
  const row = db().prepare("SELECT mode, external_account_id, connection_status FROM integrations WHERE brand_id = ? AND provider = 'canva'").get(brandId) as { mode: string; external_account_id: string | null; connection_status: string } | undefined;
  if (!row || row.mode !== "mcp" || !row.external_account_id) return null;
  return { designId: row.external_account_id, url: `https://www.canva.com/design/${row.external_account_id}/edit`, status: row.connection_status };
}
export function saveCanvaDesign(brandId: string, input: string) {
  const id = parseCanvaDesignId(input); if (!id) throw new Error("Paste a Canva design link like https://www.canva.com/design/<design id>/…");
  db().prepare("UPDATE integrations SET mode = 'mcp', external_account_id = ?, connection_status = 'configured', last_checked_at = NULL WHERE brand_id = ? AND provider = 'canva'").run(id, brandId);
  return id;
}
export function clearCanvaDesign(brandId: string) { db().prepare("UPDATE integrations SET mode = 'disabled', external_account_id = NULL, connection_status = 'not_connected' WHERE brand_id = ? AND provider = 'canva'").run(brandId); }
