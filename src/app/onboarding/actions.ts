"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { isDesignLink, pdfText, suggestFromText, suggestFromWebsite, type DraftSuggestion } from "@/server/brand/extract";
import { saveConfirmedBrand } from "@/server/brand/service";
import { saveBrandLogo } from "@/server/brand/logo";
import { saveFigmaFile } from "@/server/integrations/figma";
import { saveCanvaDesign } from "@/server/integrations/canva";

async function ctx() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/workspaces/new");
  return { userId, brandId: brand.id, db };
}

export type ReadState = { suggestion?: DraftSuggestion; sourceName?: string; kind?: "file" | "website" | "design" | "sample"; note?: string; error?: string };
const nexaSample: DraftSuggestion = { primaryColour: "#2457F5", typeface: "Geist", buttonRadius: "8px", previousColour: "#164B9B", previousTypeface: "Inter", previousRadius: "4px", voice: "Clear, calm and direct. Short sentences, no jargon.", version: "2.0", colours: ["#2457F5", "#164B9B"], fonts: ["Geist", "Inter"], found: ["colour", "typeface", "corner radius", "voice"] };

/** Step 1: read a guideline from a file, a website or a design link and suggest values for the person to check. */
export async function readGuideline(_: ReadState, formData: FormData): Promise<ReadState> {
  const { brandId } = await ctx();
  const kind = String(formData.get("kind") ?? "file");
  try {
    if (kind === "sample") return { suggestion: nexaSample, sourceName: "Sample brand (Nexa)", kind: "sample", note: "These are sample values. Change them to yours, or keep them to try Markpath." };
    if (kind === "file") {
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) return { error: "Choose a guideline file first." };
      if (file.size > 10_000_000) return { error: "That file is over 10 MB. Try a smaller export." };
      const name = file.name.toLowerCase();
      const text = name.endsWith(".pdf") ? await pdfText(new Uint8Array(await file.arrayBuffer())) : /\.(md|markdown|txt|css|json)$/.test(name) ? await file.text() : null;
      if (text === null) return { error: "Use a PDF, Markdown (.md) or text file." };
      const suggestion = suggestFromText(text);
      return { suggestion, sourceName: file.name, kind: "file", note: suggestion.found.length ? `Found ${suggestion.found.join(", ")} in ${file.name}. Check them below.` : `We couldn't find brand values in ${file.name}. Add them below.` };
    }
    const link = String(formData.get("link") ?? "").trim();
    if (!link) return { error: "Paste a link first." };
    const design = isDesignLink(link);
    if (design) {
      if (design === "figma") saveFigmaFile(brandId, link); else saveCanvaDesign(brandId, link);
      return { suggestion: { colours: [], fonts: [], found: [] }, sourceName: link, kind: "design", note: `Saved as the ${design === "figma" ? "Figma file" : "Canva design"} to check. Markpath can't read rules from a design yet, so add your main colour, typeface and corner radius below.` };
    }
    const suggestion = await suggestFromWebsite(link);
    return { suggestion, sourceName: suggestion.title ?? link, kind: "website", note: suggestion.found.length ? `Read ${new URL(/^https?:/.test(link) ? link : `https://${link}`).hostname}. Found ${suggestion.found.join(", ")}. Check them below.` : "We read the site but couldn't find clear brand values. Add them below." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't read that. Try another file or link." };
  }
}

export type ConfirmState = { error?: string };
export async function confirmBrand(_: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const { brandId, userId } = await ctx();
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const fixHex = (v: string) => (v && !v.startsWith("#") ? `#${v}` : v);
  const fixPx = (v: string) => (/^\d+(\.\d+)?$/.test(v) ? `${v}px` : v);
  try {
    saveConfirmedBrand(brandId, userId, { primaryColour: fixHex(get("primaryColour")), typeface: get("typeface"), buttonRadius: fixPx(get("buttonRadius")), previousColour: fixHex(get("previousColour")), previousTypeface: get("previousTypeface"), previousRadius: fixPx(get("previousRadius")), voice: get("voice"), version: get("version") }, { kind: (get("kind") || "manual") as "file" | "website" | "design" | "manual" | "sample", name: get("sourceName") || "onboarding" });
  } catch (error) {
    const issue = (error as { issues?: Array<{ message: string }> }).issues?.[0]?.message;
    return { error: issue ?? (error instanceof Error ? error.message : "Check the values and try again.") };
  }
  revalidatePath("/", "layout");
  redirect("/onboarding?step=logo");
}

export async function uploadOnboardingLogo(formData: FormData) {
  const { brandId, userId } = await ctx();
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    try { await saveBrandLogo(brandId, userId, file); } catch (error) { redirect(`/onboarding?step=logo&problem=${encodeURIComponent(error instanceof Error ? error.message : "That logo couldn't be saved.")}`); }
  }
  redirect("/onboarding?step=github");
}

export async function saveDesignLinks(formData: FormData) {
  const { brandId } = await ctx();
  const figma = String(formData.get("figma") ?? "").trim(); const canva = String(formData.get("canva") ?? "").trim();
  try { if (figma) saveFigmaFile(brandId, figma); if (canva) saveCanvaDesign(brandId, canva); }
  catch (error) { redirect(`/onboarding?step=design&problem=${encodeURIComponent(error instanceof Error ? error.message : "Check the links.")}`); }
  redirect("/onboarding?step=chat");
}

export async function finishOnboarding() {
  const { brandId, db } = await ctx();
  db.prepare("UPDATE brands SET onboarded_at = COALESCE(onboarded_at, ?) WHERE id = ?").run(new Date().toISOString(), brandId);
  revalidatePath("/", "layout");
  redirect("/");
}
