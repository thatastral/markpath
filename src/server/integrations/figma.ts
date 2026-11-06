import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";

function db() { const database = getDatabase(); initializeSchema(database); return database; }
export const parseFigmaFileKey = (input: string) => /figma\.com\/(?:design|file|proto|board)\/([0-9a-zA-Z]{22,128})/.exec(input.trim())?.[1] ?? (/^[0-9a-zA-Z]{22,128}$/.test(input.trim()) ? input.trim() : null);

/** The Figma file this workspace audits through the Figma MCP, if one is configured. */
export function figmaMcpConfig(brandId: string) {
  const row = db().prepare("SELECT mode, external_account_id, connection_status FROM integrations WHERE brand_id = ? AND provider = 'figma'").get(brandId) as { mode: string; external_account_id: string | null; connection_status: string } | undefined;
  if (!row || row.mode !== "mcp" || !row.external_account_id) return null;
  return { fileKey: row.external_account_id, url: `https://www.figma.com/design/${row.external_account_id}`, status: row.connection_status };
}
export function saveFigmaFile(brandId: string, input: string) {
  const key = parseFigmaFileKey(input); if (!key) throw new Error("Paste a Figma design link like https://www.figma.com/design/<file key>/<name>.");
  db().prepare("UPDATE integrations SET mode = 'mcp', external_account_id = ?, connection_status = 'configured', last_checked_at = NULL WHERE brand_id = ? AND provider = 'figma'").run(key, brandId);
  return key;
}
export function clearFigmaFile(brandId: string) { db().prepare("UPDATE integrations SET mode = 'fixture', external_account_id = NULL, connection_status = 'not_connected' WHERE brand_id = ? AND provider = 'figma'").run(brandId); }
