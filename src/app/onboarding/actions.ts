"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { isDesignLink, pdfText, suggestFromText, suggestFromWebsite, type DraftSuggestion } from "@/server/brand/extract";
import { saveConfirmedBrand } from "@/server/brand/service";
import { z } from "zod";
import { saveBrandLogo } from "@/server/brand/logo";
import { saveFigmaFile } from "@/server/integrations/figma";
import { saveCanvaDesign } from "@/server/integrations/canva";

async function ctx() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/workspaces/new");
  return { userId, brandId: brand.id, db };
}

export type ReadState = { suggestion?: DraftSuggestion; sourceName?: string; kind?: "file" | "website" | "design" | "sample"; note?: string; error?: string; /** The link the person typed, kept after an error. */ link?: string; n?: number };
const nexaSample: DraftSuggestion = { primaryColour: "#2457F5", typeface: "Geist", buttonRadius: "8px", previousColour: "#164B9B", previousTypeface: "Inter", previousRadius: "4px", voice: "Clear, calm and direct. Short sentences, no jargon.", version: "2.0", colours: ["#2457F5", "#164B9B"], fonts: ["Geist", "Inter"], found: ["colour", "typeface", "corner radius", "voice"] };

/** Step 1: read a guideline from a file, a website or a design link and suggest values for the person to check. */
export async function readGuideline(prev: ReadState, formData: FormData): Promise<ReadState> {
  const { brandId } = await ctx();
  const kind = String(formData.get("kind") ?? "file");
  const link = String(formData.get("link") ?? "").trim();
  const fail = (error: string): ReadState => ({ error, link, n: (prev.n ?? 0) + 1 });
  try {
    if (kind === "sample") return { suggestion: nexaSample, sourceName: "Sample brand (Nexa)", kind: "sample", note: "These are sample values. Replace them with yours, or keep them to try Markpath." };
    if (kind === "file") {
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) return fail("Choose a guideline file first.");
      if (file.size > 10_000_000) return fail("That file is over 10 MB. Try a smaller export.");
      const name = file.name.toLowerCase();
      const text = name.endsWith(".pdf") ? await pdfText(new Uint8Array(await file.arrayBuffer())) : /\.(md|markdown|txt|css|json)$/.test(name) ? await file.text() : null;
      if (text === null) return fail("Use a PDF, Markdown (.md) or text file.");
      const suggestion = suggestFromText(text);
      return { suggestion, sourceName: file.name, kind: "file", note: suggestion.found.length ? `Found ${suggestion.found.join(", ")} in ${file.name}. Check them below.` : `We couldn't find brand values in ${file.name}. Add them below.` };
    }
    if (!link) return fail("Paste a link first.");
    const design = isDesignLink(link);
    if (design) {
      if (design === "figma") saveFigmaFile(brandId, link); else saveCanvaDesign(brandId, link);
      return { suggestion: { colours: [], fonts: [], found: [] }, sourceName: link, kind: "design", note: `${design === "figma" ? "Figma file" : "Canva design"} saved for checks. Markpath can't read rules from a design yet, so add your colour, typeface and corner radius below.` };
    }
    const suggestion = await suggestFromWebsite(link);
    return { suggestion, sourceName: suggestion.title ?? link, kind: "website", note: suggestion.found.length ? `Read ${new URL(/^https?:/.test(link) ? link : `https://${link}`).hostname}. Found ${suggestion.found.join(", ")}. Check them below.` : "We read the site but couldn't find clear brand values. Add them below." };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    // Network failures (DNS, refused, timeouts) get plain words instead of Node's error text.
    if (kind !== "file" && /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|fetch failed|aborted|timeout|certificate/i.test(raw)) return fail("We couldn't reach that website. Check the address, or upload your guideline instead.");
    return fail(raw || "We couldn't read that. Try another file or link.");
  }
}

/** After saving rules: back to the Brand page when setup is already finished, otherwise the next onboarding step. */
function afterRules(db: ReturnType<typeof getDatabase>, brandId: string) {
  const row = db.prepare("SELECT onboarded_at FROM brands WHERE id = ?").get(brandId) as { onboarded_at: string | null } | undefined;
  return row?.onboarded_at ? "/brand" : "/onboarding?step=logo";
}

const fieldMessages: Record<string, string> = {
  primaryColour: "Use a 6-digit hex colour, like #1A73E8.",
  typeface: "Add the main typeface.",
  buttonRadius: "Use pixels, like 8px.",
  previousColour: "Use a 6-digit hex colour, like #0B57D0, or leave it blank.",
  previousRadius: "Use pixels, like 4px, or leave it blank.",
};
export type ConfirmState = { error?: string; field?: string; n?: number };
export async function confirmBrand(prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const { brandId, userId, db } = await ctx();
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const fixHex = (v: string) => (v && !v.startsWith("#") ? `#${v}` : v);
  const fixPx = (v: string) => (/^\d+(\.\d+)?$/.test(v) ? `${v}px` : v);
  try {
    saveConfirmedBrand(brandId, userId, { primaryColour: fixHex(get("primaryColour")), typeface: get("typeface"), buttonRadius: fixPx(get("buttonRadius")), previousColour: fixHex(get("previousColour")), previousTypeface: get("previousTypeface"), previousRadius: fixPx(get("previousRadius")), voice: get("voice"), version: get("version") }, { kind: (get("kind") || "manual") as "file" | "website" | "design" | "manual" | "sample", name: get("sourceName") || "onboarding" });
  } catch (error) {
    const issue = (error as { issues?: Array<{ message: string; path?: Array<string | number> }> }).issues?.[0];
    const field = issue?.path?.[0] ? String(issue.path[0]) : undefined;
    return { error: (field && fieldMessages[field]) ?? issue?.message ?? (error instanceof Error ? error.message : "Check the values and try again."), field, n: (prev.n ?? 0) + 1 };
  }
  revalidatePath("/", "layout");
  redirect(afterRules(db, brandId));
}

export async function uploadOnboardingLogo(formData: FormData) {
  const { brandId, userId } = await ctx();
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    try { await saveBrandLogo(brandId, userId, file); } catch (error) { redirect(`/onboarding?step=logo&problem=${encodeURIComponent(error instanceof Error ? error.message : "That logo couldn't be saved. Try a PNG, JPG or WebP under 1 MB.")}`); }
  }
  redirect("/onboarding?step=github");
}

/** Both links come back on an error so neither field clears; `field` says which one is wrong. */
export type DesignState = { error?: string; field?: "figma" | "canva"; figma?: string; canva?: string; n?: number };
export async function saveDesignLinks(prev: DesignState, formData: FormData): Promise<DesignState> {
  const { brandId } = await ctx();
  const figma = String(formData.get("figma") ?? "").trim(); const canva = String(formData.get("canva") ?? "").trim();
  const kept = { figma, canva, n: (prev.n ?? 0) + 1 };
  if (figma) { try { saveFigmaFile(brandId, figma); } catch (error) { return { ...kept, field: "figma", error: error instanceof Error ? error.message : "Check the Figma link. Copy the full address from your browser." }; } }
  if (canva) { try { saveCanvaDesign(brandId, canva); } catch (error) { return { ...kept, field: "canva", error: error instanceof Error ? error.message : "Check the Canva link. Copy the full address from your browser." }; } }
  redirect("/onboarding?step=chat");
}

const agentPrefix = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9-]{0,19}$/);
export type PrefixState = { error?: string; saved?: string; value?: string; n?: number };
/** Chat step: name the agents before copying the room template (same rule as Integrations). */
export async function saveAgentPrefix(prev: PrefixState, formData: FormData): Promise<PrefixState> {
  const { brandId, userId, db } = await ctx();
  const value = String(formData.get("prefix") ?? ""); const n = (prev.n ?? 0) + 1;
  const owner = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brandId) as { role: string } | undefined;
  if (owner?.role !== "owner") return { error: "Only the workspace owner can rename the agents.", value, n };
  const parsed = agentPrefix.safeParse(value);
  if (!parsed.success) return { error: "Use lowercase letters, numbers and dashes, starting with a letter (up to 20).", value, n };
  db.prepare("UPDATE brands SET team_prefix = ? WHERE id = ?").run(parsed.data, brandId);
  revalidatePath("/onboarding"); revalidatePath("/integrations");
  return { saved: parsed.data, value: parsed.data, n };
}

export async function finishOnboarding() {
  const { brandId, db } = await ctx();
  db.prepare("UPDATE brands SET onboarded_at = COALESCE(onboarded_at, ?) WHERE id = ?").run(new Date().toISOString(), brandId);
  revalidatePath("/", "layout");
  redirect("/");
}
