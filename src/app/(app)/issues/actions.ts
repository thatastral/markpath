"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { decideApprovalForOwner } from "@/server/dashboard/service";

export async function decideDashboardApproval(approvalId: string, decision: "approved" | "rejected") {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  decideApprovalForOwner(db, { approvalId, userId, decision });
  revalidatePath("/"); revalidatePath("/issues"); revalidatePath("/activity");
}
