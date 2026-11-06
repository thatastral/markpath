"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { clearFigmaFile, saveFigmaFile } from "@/server/integrations/figma";

const handle = z.string().trim().min(1, "Enter your chat handle.").max(100).transform((v) => v.replace(/^@/, "").split(":")[0]);
export async function saveChatHandle(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (owner?.role !== "owner") return;
  const parsed = handle.safeParse(formData.get("handle")); if (!parsed.success) return;
  db.transaction(() => { db.prepare("DELETE FROM chat_identities WHERE brand_id = ? AND user_id = ?").run(brand.id, userId); db.prepare("INSERT OR REPLACE INTO chat_identities (id, brand_id, user_id, handle, created_at) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), brand.id, userId, parsed.data, new Date().toISOString()); })();
  revalidatePath("/integrations"); revalidatePath("/");
}

const prefix = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9-]{0,19}$/, "Use lowercase letters, numbers and dashes, starting with a letter.");
export async function saveTeamPrefix(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (owner?.role !== "owner") return;
  const parsed = prefix.safeParse(formData.get("prefix")); if (!parsed.success) return;
  db.prepare("UPDATE brands SET team_prefix = ? WHERE id = ?").run(parsed.data, brand.id);
  revalidatePath("/integrations");
}

export async function saveFigmaFileAction(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (owner?.role !== "owner") return;
  const link = String(formData.get("link") ?? "");
  if (link.trim() === "") clearFigmaFile(brand.id); else { try { saveFigmaFile(brand.id, link); } catch { return; } }
  revalidatePath("/integrations");
}
