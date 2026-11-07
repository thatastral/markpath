import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { addMembership, createBrand, createIntegrationPlaceholder } from "@/server/db/repositories";
import { approveSpec, ingestFixtureGuideline } from "@/server/brand/service";

export const workspaceInput = z.object({ name: z.string().trim().min(2, "Give the workspace a name of at least 2 characters.").max(80), description: z.string().trim().max(300).default(""), chatHandle: z.string().trim().max(100).default(""), demoData: z.boolean().default(false) });

export async function createWorkspace(userId: string, input: z.infer<typeof workspaceInput>) {
  const db = getDatabase(); initializeSchema(db);
  const brand = createBrand(db, { name: input.name, description: input.description, approvalOwner: userId });
  addMembership(db, userId, brand.id, "owner");
  createIntegrationPlaceholder(db, brand.id, "github", "fixture"); createIntegrationPlaceholder(db, brand.id, "figma", "fixture");
  createIntegrationPlaceholder(db, brand.id, "canva", "disabled"); createIntegrationPlaceholder(db, brand.id, "switch", "not_configured");
  if (input.chatHandle) db.prepare("INSERT OR IGNORE INTO chat_identities (id, brand_id, user_id, handle, created_at) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), brand.id, userId, input.chatHandle.replace(/^@/, ""), new Date().toISOString());
  if (input.demoData) db.prepare("UPDATE brands SET is_demo = 1 WHERE id = ?").run(brand.id);
  if (input.demoData) { const version = await ingestFixtureGuideline(brand.id, userId); approveSpec(brand.id, userId, version.id); }
  return brand;
}
