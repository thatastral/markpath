import { cookies } from "next/headers";
import type Database from "better-sqlite3";
import { findBrandForUser, findFirstBrandForUser } from "@/server/db/repositories";

export const brandCookie = "markpath_workspace";
/** The workspace the user chose in the switcher, if they still belong to it; otherwise their first one. */
export async function activeBrandForUser(db: Database.Database, userId: string) {
  const chosen = (await cookies()).get(brandCookie)?.value;
  if (chosen) { const brand = findBrandForUser(db, chosen, userId); if (brand) return brand; }
  return findFirstBrandForUser(db, userId);
}
export async function setActiveBrand(brandId: string) { (await cookies()).set(brandCookie, brandId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 }); }
export function listBrandsForUser(db: Database.Database, userId: string) {
  return db.prepare("SELECT b.id, b.name FROM brands b JOIN memberships m ON m.brand_id = b.id WHERE m.user_id = ? ORDER BY b.created_at").all(userId) as Array<{ id: string; name: string }>;
}
