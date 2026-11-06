"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { approveSpec, ingestFixtureGuideline, ingestGuidelineUpload } from "@/server/brand/service";

function returnToBrand(message?: string) { redirect(`/brand${message ? `?message=${encodeURIComponent(message)}` : ""}`); }

export async function extractFixture(brandId: string) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  await ingestFixtureGuideline(brandId, userId); revalidatePath("/brand"); returnToBrand("Fixture guideline extracted for review.");
}

export async function uploadGuideline(brandId: string, formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const file = formData.get("guideline");
  if (!(file instanceof File)) { returnToBrand("Choose a Markdown guideline to upload."); return; }
  try { await ingestGuidelineUpload(brandId, userId, file); } catch (error) { returnToBrand(error instanceof Error ? error.message : "Guideline upload failed."); }
  revalidatePath("/brand"); returnToBrand("Guideline extracted for review.");
}

export async function approveVersion(brandId: string, versionId: string) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  await approveSpec(brandId, userId, versionId); revalidatePath("/brand"); revalidatePath("/"); returnToBrand("Brand specification approved and activated.");
}
