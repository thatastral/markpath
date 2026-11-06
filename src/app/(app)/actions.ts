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
  redirect("/");
}
