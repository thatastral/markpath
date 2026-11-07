"use server";
import { redirect } from "next/navigation";
import { currentUserId, endSession } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findBrandForUser } from "@/server/db/repositories";
import { setActiveBrand } from "@/server/workspace/active";
export async function logout() { await endSession(); redirect("/login"); }

export async function switchWorkspace(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const brandId = String(formData.get("brandId") ?? "");
  const db = getDatabase(); initializeSchema(db);
  if (findBrandForUser(db, brandId, userId)) await setActiveBrand(brandId);
  redirect(safeNext(String(formData.get("next") ?? "")));
}

/** Stay on the same page in the new workspace. Only known app sections, plus an approval link (it opens for any member). */
const SECTIONS = ["/issues", "/brand", "/reviews", "/activity", "/integrations"];
function safeNext(next: string): string {
  const path = next.split(/[?#]/)[0];
  if (/^\/approve\/[0-9a-f-]{36}$/i.test(path)) return path;
  return SECTIONS.find((s) => path === s || path.startsWith(`${s}/`)) ? path : "/";
}
