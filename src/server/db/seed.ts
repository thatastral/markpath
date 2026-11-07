import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { existsSync, unlinkSync } from "node:fs";
import { getDatabase, databasePath, closeDatabase } from "./client";
import { initializeSchema } from "./schema";
import { addMembership, createBrand, createIntegrationPlaceholder, createUser, findUserByEmail } from "./repositories";

export const DEMO_USER = { email: "demo@markpath.local", password: "markpath-demo", name: "Demo Owner" };

export async function seedDatabase(path?: string, reset = false) {
  const resolved = databasePath(path);
  if (reset && existsSync(resolved)) {
    closeDatabase(resolved);
    unlinkSync(resolved);
  }
  const db = getDatabase(resolved);
  initializeSchema(db);
  let user = findUserByEmail(db, DEMO_USER.email);
  if (!user) {
    user = createUser(db, { email: DEMO_USER.email, name: DEMO_USER.name, password_hash: await bcrypt.hash(DEMO_USER.password, 12) });
  }
  const existingBrand = db.prepare("SELECT id, name FROM brands WHERE name = ?").get("Nexa") as { id: string; name: string } | undefined;
  const brand = existingBrand ?? createBrand(db, { name: "Nexa", description: "Demo fintech workspace for the Markpath fixture workflow.", approvalOwner: user.id });
  db.prepare("UPDATE brands SET is_demo = 1, onboarded_at = COALESCE(onboarded_at, ?) WHERE id = ?").run(new Date().toISOString(), brand.id);
  addMembership(db, user.id, brand.id, "owner");
  // The bundled local Switch/Mattermost server has a single human, "switch-admin". Change it on the Integrations page.
  db.prepare("INSERT OR IGNORE INTO chat_identities (id, brand_id, user_id, handle, created_at) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), brand.id, user.id, "switch-admin", new Date().toISOString());
  createIntegrationPlaceholder(db, brand.id, "github", process.env.GITHUB_MODE ?? "fixture");
  createIntegrationPlaceholder(db, brand.id, "figma", process.env.FIGMA_MODE ?? "fixture");
  createIntegrationPlaceholder(db, brand.id, "canva", process.env.CANVA_MODE ?? "disabled");
  createIntegrationPlaceholder(db, brand.id, "switch", "not_configured");
  return { user, brand };
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase(undefined, process.argv.includes("--reset")).then(({ user, brand }) => {
    console.log(`Seeded ${brand.name} for ${user.email}`);
  });
}
