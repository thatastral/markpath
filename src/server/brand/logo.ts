import { randomUUID } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findBrandForUser } from "@/server/db/repositories";

const types: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
/** Stores the workspace's approved reference logo. Only an owner-visible workspace member can upload it, and only a real image of a sensible size is accepted. */
export async function saveBrandLogo(brandId: string, userId: string, file: File) {
  const db = getDatabase(); initializeSchema(db);
  if (!findBrandForUser(db, brandId, userId)) throw new Error("Workspace not found.");
  const ext = types[file.type]; if (!ext) throw new Error("Upload a PNG, JPG or WebP image.");
  if (file.size === 0 || file.size > 1_000_000) throw new Error("The logo must be between 1 byte and 1 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const magic = ext === "png" ? bytes.subarray(0, 4).toString("hex") === "89504e47" : ext === "jpg" ? bytes.subarray(0, 2).toString("hex") === "ffd8" : bytes.subarray(0, 4).toString() === "RIFF";
  if (!magic) throw new Error("That file is not a valid image of the type it claims to be.");
  db.prepare("INSERT INTO brand_assets (id, brand_id, kind, filename, storage_path, content_type, created_at, data_base64) VALUES (?, ?, 'logo', ?, 'database', ?, ?, ?)").run(randomUUID(), brandId, file.name.replace(/[^\w.-]/g, "-").slice(0, 80), file.type, new Date().toISOString(), bytes.toString("base64"));
}
