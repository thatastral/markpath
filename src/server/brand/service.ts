import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { addBrandSpecVersion, addGuideline, approveBrandSpecVersion, findBrandForUser } from "@/server/db/repositories";
import { extractFixtureBrandSpec } from "./spec";
import { brandDraftSchema } from "./extract";
import { brandSpecSchema } from "./spec";

const uploadDirectory = () => join(process.env.VERCEL ? "/tmp/markpath" : join(process.cwd(), "data"), "uploads"); // Vercel only allows writing to /tmp; the extracted spec itself lives in the database

async function saveAndExtract(brandId: string, userId: string, originalName: string, contents: string, sourceType: string) {
  const db = getDatabase(); initializeSchema(db);
  const brand = findBrandForUser(db, brandId, userId);
  if (!brand) throw new Error("Workspace not found.");
  await mkdir(uploadDirectory(), { recursive: true });
  const storagePath = join(uploadDirectory(), `${randomUUID()}-${basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "-")}`);
  await writeFile(storagePath, contents, "utf8");
  const guideline = addGuideline(db, { brandId, originalName, storagePath, contentType: "text/markdown", extractionMode: "fixture extraction" });
  const specification = extractFixtureBrandSpec(contents, brand.name);
  return addBrandSpecVersion(db, { brandId, guidelineId: guideline.id, version: specification.version, specification: JSON.stringify(specification), sourceType, createdBy: userId });
}

export async function ingestFixtureGuideline(brandId: string, userId: string) {
  const source = join(process.cwd(), "fixtures", "nexa-brand-guidelines.md");
  const contents = await readFile(source, "utf8");
  return saveAndExtract(brandId, userId, "nexa-brand-guidelines.md", contents, "fixture");
}

export async function ingestGuidelineUpload(brandId: string, userId: string, file: File) {
  if (file.size === 0 || file.size > 1_000_000) throw new Error("Upload a non-empty Markdown guideline under 1 MB.");
  if (extname(file.name).toLowerCase() !== ".md") throw new Error("This demo supports Markdown guideline files. PDF extraction is not yet enabled.");
  return saveAndExtract(brandId, userId, file.name, await file.text(), "uploaded fixture extraction");
}

export function approveSpec(brandId: string, userId: string, versionId: string) {
  const db = getDatabase(); initializeSchema(db);
  if (!findBrandForUser(db, brandId, userId)) throw new Error("Workspace not found.");
  if (!approveBrandSpecVersion(db, { id: versionId, brandId, userId })) throw new Error("Specification version not found.");
}

/** Saves the values a person confirmed during onboarding as an approved brand specification. */
export function saveConfirmedBrand(brandId: string, userId: string, input: unknown, source: { kind: "file" | "website" | "design" | "manual" | "sample"; name: string }) {
  const draft = brandDraftSchema.parse(input);
  const db = getDatabase(); initializeSchema(db);
  const brand = findBrandForUser(db, brandId, userId); if (!brand) throw new Error("Workspace not found.");
  const ref = `Confirmed by you from ${source.kind === "website" ? "the website" : source.kind === "design" ? "the design link" : source.kind === "file" ? "the uploaded guideline" : "your answers"} (${source.name.slice(0, 80)})`;
  const opt = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  const rules = [
    { id: "primary-colour", category: "colour" as const, label: "Primary colour", expected: draft.primaryColour.toUpperCase(), previous: opt(draft.previousColour)?.toUpperCase(), sourceReference: ref, status: "approved" as const },
    { id: "primary-typeface", category: "typography" as const, label: "Primary typeface", expected: draft.typeface.trim(), previous: opt(draft.previousTypeface), sourceReference: ref, status: "approved" as const },
    { id: "button-radius", category: "component" as const, label: "Button radius", expected: draft.buttonRadius, previous: opt(draft.previousRadius), sourceReference: ref, status: "approved" as const },
    ...(opt(draft.voice) ? [{ id: "brand-voice", category: "voice" as const, label: "Brand voice", expected: opt(draft.voice)!, sourceReference: ref, status: "approved" as const }] : []),
    { id: "text-contrast", category: "accessibility" as const, label: "Minimum text contrast", expected: "4.5:1", sourceReference: "WCAG AA default", status: "approved" as const },
  ];
  const specification = brandSpecSchema.parse({ brandName: brand.name, version: opt(draft.version) ?? "1.0", extractionMode: "fixture extraction", rules });
  const guideline = addGuideline(db, { brandId, originalName: source.name.slice(0, 200), storagePath: `${source.kind}:${source.name.slice(0, 200)}`, contentType: "text/plain", extractionMode: `${source.kind} reviewed by a person` });
  const version = addBrandSpecVersion(db, { brandId, guidelineId: guideline.id, version: specification.version, specification: JSON.stringify(specification), sourceType: source.kind, createdBy: userId });
  approveSpec(brandId, userId, version.id);
  return version;
}
