"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { decideTaskApprovals } from "@/server/dashboard/service";

const input = z.object({ taskId: z.string().uuid(), decision: z.enum(["approved", "rejected"]) });
export async function decideTask(formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const parsed = input.parse({ taskId: formData.get("taskId"), decision: formData.get("decision") });
  const db = getDatabase(); initializeSchema(db);
  decideTaskApprovals(db, { ...parsed, userId });
  revalidatePath(`/approve/${parsed.taskId}`); revalidatePath("/issues"); revalidatePath("/activity"); revalidatePath("/");
}
