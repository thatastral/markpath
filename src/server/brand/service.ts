import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { addBrandSpecVersion, addGuideline, approveBrandSpecVersion, findBrandForUser } from "@/server/db/repositories";
import { extractFixtureBrandSpec } from "./spec";

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
