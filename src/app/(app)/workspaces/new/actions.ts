"use server";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { setActiveBrand } from "@/server/workspace/active";
import { createWorkspace, workspaceInput } from "@/server/workspace/service";

export type WorkspaceState = { error?: string };
export async function createWorkspaceAction(_: WorkspaceState, formData: FormData): Promise<WorkspaceState> {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const parsed = workspaceInput.safeParse({ name: formData.get("name"), description: formData.get("description") ?? "", chatHandle: formData.get("chatHandle") ?? "", demoData: formData.get("demoData") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const brand = await createWorkspace(userId, parsed.data);
  await setActiveBrand(brand.id);
  redirect("/onboarding");
}
