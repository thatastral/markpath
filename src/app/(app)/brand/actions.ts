"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { approveSpec, ingestFixtureGuideline, ingestGuidelineUpload } from "@/server/brand/service";
import { saveBrandLogo } from "@/server/brand/logo";

function returnToBrand(message?: string) { redirect(`/brand${message ? `?message=${encodeURIComponent(message)}` : ""}`); }

export async function extractFixture(brandId: string) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  await ingestFixtureGuideline(brandId, userId); revalidatePath("/brand"); returnToBrand("Sample loaded. Review the rules below, then approve them.");
}

export async function uploadGuideline(brandId: string, formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const file = formData.get("guideline");
  if (!(file instanceof File)) { returnToBrand("Choose a Markdown guideline to upload."); return; }
  try { await ingestGuidelineUpload(brandId, userId, file); } catch (error) { returnToBrand(error instanceof Error ? error.message : "That guideline couldn't be read. Upload a Markdown (.md) file."); }
  revalidatePath("/brand"); returnToBrand("Guideline read. Review the rules below, then approve them.");
}

export async function approveVersion(brandId: string, versionId: string) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  await approveSpec(brandId, userId, versionId); revalidatePath("/brand"); revalidatePath("/"); returnToBrand("Rules approved. The agents now check against this version.");
}

export async function uploadLogo(brandId: string, formData: FormData) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const file = formData.get("logo");
  if (!(file instanceof File)) { returnToBrand("Choose a logo image to upload."); return; }
  try { await saveBrandLogo(brandId, userId, file); } catch (error) { returnToBrand(error instanceof Error ? error.message : "That logo couldn't be saved. Try a PNG, JPG or WebP under 1 MB."); }
  revalidatePath("/brand"); returnToBrand("Logo saved. Reviews now compare logos in your designs with it.");
}
