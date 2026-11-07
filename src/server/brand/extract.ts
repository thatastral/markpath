import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";

/** The values onboarding asks a person to confirm. Extraction only pre-fills them; the person always checks them. */
export const brandDraftSchema = z.object({
  primaryColour: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour, like #2457F5."),
  typeface: z.string().trim().min(1, "Add the main typeface.").max(60),
  buttonRadius: z.string().regex(/^\d+(\.\d+)?px$/, "Use pixels, like 8px."),
  previousColour: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  previousTypeface: z.string().trim().max(60).optional().or(z.literal("")),
  previousRadius: z.string().regex(/^\d+(\.\d+)?px$/).optional().or(z.literal("")),
  voice: z.string().trim().max(300).optional().or(z.literal("")),
  version: z.string().trim().max(20).optional().or(z.literal("")),
});
export type BrandDraft = z.infer<typeof brandDraftSchema>;
export type DraftSuggestion = Partial<BrandDraft> & { colours: string[]; fonts: string[]; found: string[] };

const hex = (v: string) => (v.length === 4 ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}` : v).toUpperCase();
const greyish = (h: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const light = (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
  return Math.max(r, g, b) - Math.min(r, g, b) < 24 || light > 0.9 || light < 0.08; // greys, near-white tints and near-black are never the brand colour
};
/** "sohne-var", "inter_display", "__Inter_Fallback" → "Sohne", "Inter Display", "Inter". */
export function prettyFont(raw: string) {
  const f = raw.replace(/^__|_Fallback.*$|[-_ ]?(var|variable|vf|webfont|wght.*)$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return f.split(" ").map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(" ");
}
const genericFonts = new Set(["sans-serif", "serif", "monospace", "system-ui", "inherit", "initial", "ui-sans-serif", "ui-serif", "ui-monospace", "-apple-system", "blinkmacsystemfont", "arial", "helvetica", "helvetica neue", "segoe ui", "roboto", "times new roman", "apple color emoji", "segoe ui emoji", "noto color emoji", "var"]);
const near = (text: string, words: RegExp, value: RegExp) => { for (const line of text.split(/\r?\n/)) if (words.test(line)) { const m = value.exec(line); if (m) return m[1] ?? m[0]; } return undefined; };

/** Pulls likely brand values out of any guideline text, CSS or HTML. Labelled values ("Primary colour: #…") win over frequency. */
export function suggestFromText(text: string, mode: "document" | "website" = "document"): DraftSuggestion {
  const web = mode === "website";
  const found: string[] = [];
  const counts = new Map<string, number>();
  for (const m of text.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) { const h = hex(m[0]); if (!greyish(h)) counts.set(h, (counts.get(h) ?? 0) + 1); }
  const colours = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 8);
  const labelledRaw = web ? /--(?:[\w-]*?)(?:primary|brand|accent)[\w-]*\s*:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b/i.exec(text)?.[1] : near(text, /(primary|brand|accent|main)[^\n]{0,30}(colou?r|blue|green|red|purple|orange)?/i, /(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b/);
  const labelled = labelledRaw && !greyish(hex(labelledRaw)) ? labelledRaw : undefined;
  const previousColourRaw = web ? undefined : near(text, /(previous|old|legacy|former|replaces|supersede)/i, /(#[0-9a-fA-F]{6})\b/);
  const previousColour = previousColourRaw && !greyish(hex(previousColourRaw)) ? previousColourRaw : undefined;
  const fontCounts = new Map<string, number>();
  for (const m of text.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) for (const part of m[1].split(",")) { const f = part.trim().replace(/^["']|["']$/g, "").replace(/!important/, "").trim(); if (f && !genericFonts.has(f.toLowerCase()) && !f.startsWith("var(") && !/fallback|emoji|symbol|icon/i.test(f)) { const name = prettyFont(f); if (name && !genericFonts.has(name.toLowerCase())) fontCounts.set(name, (fontCounts.get(name) ?? 0) + 1); } }
  for (const m of text.matchAll(/fonts\.googleapis\.com\/css2?\?family=([A-Za-z+]+)/g)) { const f = m[1].replace(/\+/g, " "); fontCounts.set(f, (fontCounts.get(f) ?? 0) + 5); }
  const stop = new Set(["The", "This", "That", "Our", "Your", "Use", "And", "For", "With", "Primary", "Brand", "Main", "Body", "Heading"]);
  const labelledFontRaw = web ? undefined : near(text, /(primary|brand|main|heading|body)?\s*(typeface|font)\b(?!-)/i, /(?:typeface|font)[^:\n]*[:\-–]\s*`?["']?([A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*){0,2})/);
  const labelledFont = labelledFontRaw && !stop.has(labelledFontRaw.split(" ")[0]) ? labelledFontRaw : undefined;
  const fonts = [...new Set([...(labelledFont ? [labelledFont] : []), ...[...fontCounts.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f)])].slice(0, 6);
  const previousTypeface = web ? undefined : near(text, /(previous|old|legacy|former|supersede)/i, /([A-Z][A-Za-z]+) (?:typeface|font)/);
  const radiusCounts = new Map<string, number>(); for (const m of text.matchAll(/border-radius\s*:\s*(\d+(?:\.\d+)?px)/gi)) if (Number.parseFloat(m[1]) >= 2 && Number.parseFloat(m[1]) <= 24) radiusCounts.set(m[1], (radiusCounts.get(m[1]) ?? 0) + 1);
  const commonRadius = [...radiusCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const radius = (web ? undefined : near(text, /(button|btn|corner|radius)/i, /(\d+(?:\.\d+)?px)/)) ?? commonRadius;
  const previousRadius = web ? undefined : near(text, /(previous|old|legacy|former|supersede)/i, /(\d+(?:\.\d+)?px)\s*(?:button )?radius/i);
  const voice = web ? undefined : near(text, /(voice|tone)\s*[:\-–]/i, /(?:voice|tone)\s*[:\-–]\s*(.{8,240})/i);
  const version = /version\s*v?([\d.]+)/i.exec(text)?.[1];
  const primaryColour = labelled ? hex(labelled) : colours[0];
  if (primaryColour) found.push("colour"); if (fonts[0]) found.push("typeface"); if (radius) found.push("corner radius"); if (voice) found.push("voice");
  return { primaryColour, typeface: fonts[0], buttonRadius: radius, previousColour: previousColour ? hex(previousColour) : undefined, previousTypeface, previousRadius, voice, version, colours, fonts, found };
}

/** Reads the text out of a PDF guideline. */
export async function pdfText(bytes: Uint8Array) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const doc = await getDocumentProxy(bytes);
  const { text } = await extractText(doc, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

function privateAddress(ip: string) {
  if (ip.includes(":")) return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80") || ip.startsWith("::ffff:127.") || ip === "::";
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}
async function safeFetch(url: URL, limit: number) {
  if (!/^https?:$/.test(url.protocol)) throw new Error("Use a web address that starts with https://.");
  const host = url.hostname;
  let ips: string[];
  try { ips = isIP(host) ? [host] : (await lookup(host, { all: true })).map((r) => r.address); } catch { throw new Error("We couldn't reach that website. Check the address, or upload your guideline instead."); }
  if (!ips.length || ips.some(privateAddress)) throw new Error("That address isn't a public website.");
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Markpath brand reader", Accept: "text/html,text/css,*/*" } });
  if (!res.ok) throw new Error(`The site answered with an error (${res.status}).`);
  const text = await res.text(); return text.slice(0, limit);
}

/** Reads a public website and its stylesheets, then suggests brand values from them. */
export async function suggestFromWebsite(address: string): Promise<DraftSuggestion & { title?: string }> {
  let url: URL; try { url = new URL(/^https?:\/\//i.test(address) ? address : `https://${address}`); } catch { throw new Error("That doesn't look like a web address."); }
  const html = await safeFetch(url, 600_000);
  const sheets = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)].map((m) => /href=["']([^"']+)["']/i.exec(m[0])?.[1]).filter(Boolean).slice(0, 4) as string[];
  const css = (await Promise.all(sheets.map((href) => safeFetch(new URL(href, url), 400_000).catch(() => "")))).join("\n");
  const themeColour = /<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-fA-F]{3,6})["']/i.exec(html)?.[1];
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n") + [...html.matchAll(/style=["']([^"']+)["']/gi)].map((m) => m[1]).join(";");
  const fontLinks = [...html.matchAll(/fonts\.googleapis\.com\/css2?\?family=[^"'&\s]+/g)].map((m) => m[0]).join("\n");
  const title = /<title[^>]*>([^<]{1,120})<\/title>/i.exec(html)?.[1]?.trim();
  const suggestion = suggestFromText(`${styles}\n${css}\n${fontLinks}`, "website");
  if (!suggestion.primaryColour && themeColour && !greyish(hex(themeColour))) suggestion.primaryColour = hex(themeColour);
  return { ...suggestion, title };
}

export function isDesignLink(address: string) {
  return /(^|\/\/)(www\.)?figma\.com\/(design|file)\//i.test(address) ? "figma" : /(^|\/\/)(www\.)?canva\.com\/design\//i.test(address) ? "canva" : null;
}
