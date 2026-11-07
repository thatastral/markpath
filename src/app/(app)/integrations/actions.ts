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
import { clearCanvaDesign, saveCanvaDesign } from "@/server/integrations/canva";
import { setScheduleAudits, setWatchPulls } from "@/server/integrations/github";
import { runRepoAudit } from "@/server/integrations/vet";

const done = (message: string): never => redirect(`/integrations?saved=${encodeURIComponent(message)}`);
const problem = (message: string): never => redirect(`/integrations?problem=${encodeURIComponent(message)}`);
const handle = z.string().trim().min(1, "Enter your chat handle.").max(100).transform((v) => v.replace(/^@/, "").split(":")[0]);
export async function saveChatHandle(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (owner?.role !== "owner") return;
  const parsed = handle.safeParse(formData.get("handle")); if (!parsed.success) return problem("Enter your chat handle, for example your Discord, Slack or Telegram username.");
  db.transaction(() => { db.prepare("DELETE FROM chat_identities WHERE brand_id = ? AND user_id = ?").run(brand.id, userId); db.prepare("INSERT OR REPLACE INTO chat_identities (id, brand_id, user_id, handle, created_at) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), brand.id, userId, parsed.data, new Date().toISOString()); })();
  revalidatePath("/integrations"); revalidatePath("/"); done("Chat handle saved.");
}

const prefix = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9-]{0,19}$/, "Use lowercase letters, numbers and dashes, starting with a letter.");
export async function saveTeamPrefix(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (owner?.role !== "owner") return;
  const parsed = prefix.safeParse(formData.get("prefix")); if (!parsed.success) return problem("Use lowercase letters, numbers and dashes, starting with a letter.");
  db.prepare("UPDATE brands SET team_prefix = ? WHERE id = ?").run(parsed.data, brand.id);
  revalidatePath("/integrations"); revalidatePath("/"); done(`Saved. Your agents will be called ${parsed.data}-director, ${parsed.data}-design and so on. Copy the room template again to create them.`);
}

export async function saveFigmaFileAction(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (owner?.role !== "owner") return;
  const link = String(formData.get("link") ?? "");
  if (link.trim() === "") { clearFigmaFile(brand.id); revalidatePath("/integrations"); return done("Figma file removed."); }
  try { saveFigmaFile(brand.id, link); } catch { return problem("That doesn't look like a Figma design link. Open the file in Figma, copy the address and paste it here."); }
  revalidatePath("/integrations"); revalidatePath("/"); done("Figma file saved. The Design agent will read it the next time you ask for a check.");
}

export async function saveCanvaDesignAction(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (owner?.role !== "owner") return;
  const link = String(formData.get("link") ?? "");
  if (link.trim() === "") { clearCanvaDesign(brand.id); revalidatePath("/integrations"); return done("Canva design removed."); }
  try { saveCanvaDesign(brand.id, link); } catch { return problem("That doesn't look like a Canva design link. Open the design in Canva, copy the address and paste it here."); }
  revalidatePath("/integrations"); revalidatePath("/"); done("Canva design saved. The Design agent will read it the next time you ask for a check.");
}

export async function saveWatchPullsAction(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (owner?.role !== "owner") return;
  const watch = formData.get("watch") === "on"; const schedule = formData.get("schedule") === "on"; setWatchPulls(brand.id, watch); setScheduleAudits(brand.id, schedule); revalidatePath("/integrations");
  done(`Saved. Pull request checks are ${watch ? "on" : "off"} and the daily repository audit is ${schedule ? "on" : "off"}.`);
}

export async function runRepoAuditAction() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (owner?.role !== "owner") return;
  try { await runRepoAudit(brand.id); } catch { /* shown as no new review */ }
  revalidatePath("/reviews"); redirect("/reviews");
}
