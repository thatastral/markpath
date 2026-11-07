// Plain-language labels for the dashboard. The database keeps machine values; people see these.
const PROVIDERS: Record<string, string> = { github: "GitHub", figma: "Figma", canva: "Canva", switch: "Chat room" };
export const providerName = (p?: string | null) => (p ? PROVIDERS[p] ?? p : "Unassigned");
const RULES: Record<string, string> = { "primary-colour": "Brand colour", "primary-typeface": "Typeface", "button-radius": "Corner radius", "text-contrast": "Text contrast", "brand-voice": "Tone of voice", "logo-usage": "Logo", "needs-review": "Needs a person" };
export const ruleName = (id: string) => RULES[id] ?? id.replaceAll("-", " ");
export const severityName = (s: string) => ({ high: "High priority", medium: "Medium priority", low: "Low priority" } as Record<string, string>)[s] ?? s;
const TASK: Record<string, string> = { RECEIVED: "Received", ASSESSING: "Looking into it", AUDITING: "Checking", PLAN_READY: "Plan ready", AWAITING_APPROVAL: "Waiting for approval", APPROVED: "Approved", IMPLEMENTING: "Applying the changes", VERIFYING: "Being verified", COMPLETED: "Done and verified", PARTIALLY_COMPLETED: "Partly done", FAILED: "Failed", REJECTED: "Rejected" };
export const taskStatusName = (s: string) => TASK[s] ?? s.replaceAll("_", " ").toLowerCase();
export const whenText = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "not yet");
export const agentLabel = (name: string) => (name === "Figma plugin" ? "Design Agent" : name);
/** A Canva design id, which is all the Canva connector gives back (no title). */
export const isCanvaId = (name: string) => /^DA[A-Za-z0-9_-]{8,}$/.test(name);
const kindOf = (kind?: string | null) => { const k = (kind ?? "").toLowerCase().split(/[_:-]/)[0]; return k === "gh" ? "github" : k; };
/** Names a design or repository the way a person would, e.g. "Canva design DAHaL7l9y7c" or "Figma file “Document”". `kind` is a provider, resource type or resource ref. */
export function resourceLabel(kind: string | null | undefined, name: string): string {
  const k = kindOf(kind) || (isCanvaId(name) ? "canva" : "");
  if (k !== "canva" && k !== "figma") return name; // GitHub repos and anything unknown read fine as they are
  const noun = k === "canva" ? "Canva design" : "Figma file";
  if (k === "canva" && isCanvaId(name)) return `${noun} ${name}`;
  if (name.toLowerCase().includes(k)) return name; // already says what it is, e.g. "Nexa Figma fixture"
  return `${noun} “${name}”`;
}
/** Free text from agents can mention a bare Canva id; name it as a Canva design. Needs a lowercase letter so words like "DASHBOARDS" are left alone; ids inside URLs are left alone too. */
export const withCanvaLabels = (text: string) => text.replace(/(?:Canva design )?["“]?(?<![\w/])(DA(?=[\w-]*[a-z])[A-Za-z0-9_-]{8,})(?![\w-])["”]?/g, (_m, id: string) => `Canva design ${id}`);
export const connectionLabel = (status: string) => ({ connected: "Connected", configured: "Set up, waiting for the first read", not_connected: "Not connected", disabled: "Not set up", error: "Needs attention" } as Record<string, string>)[status] ?? status.replaceAll("_", " ");

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const NOUN: Record<string, [string, string]> = { colour: ["colour", "colours"], typeface: ["font", "fonts"], radius: ["corner radius", "corner radii"] };
export type ApprovalChange = { property: string; from: string; to: string; count: number };
export type ApprovalView = { kind: "figma" | "canva" | "github" | "sample" | "other"; target: string; heading: string; summary: string; changes: ApprovalChange[]; whatHappens: string };

/** Turns an approval's stored operation into a sentence a person can decide on. */
export function describeApproval(approvedAction: string, resourceName: string, resourceRef?: string | null): ApprovalView {
  let operation = ""; let changes: ApprovalChange[] = [];
  try { const p = JSON.parse(approvedAction) as { operation?: string; payload?: { changes?: ApprovalChange[] } }; operation = p.operation ?? ""; changes = p.payload?.changes ?? []; } catch { /* shown as a generic operation */ }
  const list = changes.map((c) => { const [one, many] = NOUN[c.property] ?? [c.property, `${c.property}s`]; return `${plural(c.count, one, many)} from ${c.from} to ${c.to}`; });
  const joined = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] ?? "";
  if (operation === "apply_in_figma_plugin") return { kind: "figma", target: resourceName, heading: `Update the ${resourceLabel("figma", resourceName)}`, summary: joined ? `Change ${joined}.` : "Update outdated brand values.", changes, whatHappens: `The Design agent edits the real Figma file through the Figma connector and changes only the values listed here. Figma keeps version history if you ever need to go back.` };
  if (operation === "apply_in_canva_mcp") return { kind: "canva", target: resourceName, heading: `Update the ${resourceLabel("canva", resourceName)}`, summary: joined ? `Change ${joined}.` : "Update outdated brand colours.", changes, whatHappens: `The Design agent edits the real Canva design through the Canva connector and changes only the colours listed here, not the wording, fonts or layout. Canva keeps version history.` };
  if (resourceRef?.startsWith("gh:")) return { kind: "github", target: resourceName, heading: `Open a pull request in ${resourceName}`, summary: "Update the old brand colour, font and corner radius to the approved values.", changes, whatHappens: "Markpath opens a pull request for you to review. It never merges it and never touches the main branch." };
  if (operation === "replace_tokens" || operation === "replace_values") return { kind: "sample", target: resourceName, heading: `Fix the built-in sample "${resourceName}"`, summary: "Update the old brand colour, font and corner radius to the approved values.", changes, whatHappens: "This is the built-in sample. The change is simulated locally and nothing real is edited." };
  return { kind: "other", target: resourceName, heading: resourceLabel(resourceRef, resourceName), summary: operation ? `Run ${operation.replaceAll("_", " ")}.` : "Apply an approved change.", changes, whatHappens: "Only this exact change is applied." };
}

export type FindingRowLike = { id: string; provider: string | null; resource_name: string; rule_id: string; detected_value: string | null; expected_value: string | null; severity: string; confidence: number; evidence: string; recommended_action: string; classification: string };
export type FindingGroup = { key: string; provider: string | null; resource: string; rule: string; classification: string; severity: string; detected: string | null; expected: string | null; places: string[]; count: number; confidence: number; recommended: string };
/** Several places with the same problem become one card with a list of places. */
export function groupFindings(rows: FindingRowLike[]): FindingGroup[] {
  const groups = new Map<string, FindingGroup>();
  for (const f of rows) {
    const key = [f.provider, f.resource_name, f.rule_id, f.detected_value, f.expected_value, f.classification].join("|");
    const ev = f.evidence.replace(/^Found in [^:]{1,60}:\s*/, ""); // "Found in the Canva design: CTA pill uses #164B9B." → "CTA pill"
    const place = (/^([^:]{1,80}):/.exec(ev)?.[1] ?? /^(.{1,80}?) uses\b/.exec(ev)?.[1] ?? ev.slice(0, 80)).trim();
    const g = groups.get(key) ?? { key, provider: f.provider, resource: f.resource_name, rule: f.rule_id, classification: f.classification, severity: f.severity, detected: f.detected_value, expected: f.expected_value, places: [], count: 0, confidence: f.confidence, recommended: f.recommended_action };
    g.count++; if (!g.places.includes(place)) g.places.push(place); g.confidence = Math.min(g.confidence, f.confidence); groups.set(key, g);
  }
  return [...groups.values()];
}

const REVIEW: Record<string, string> = { figma: "Figma review", canva: "Canva review", github: "GitHub review", "pull request": "Pull request review", "repository audit": "Repository audit", link: "Link review", website: "Website review", url: "Link review" };
/** "repository audit" → "Repository audit"; never "Repository audit review". */
export const reviewKindName = (kind: string) => REVIEW[kind.toLowerCase()] ?? `${kind.charAt(0).toUpperCase()}${kind.slice(1).replaceAll("_", " ")} review`;

export function activityText(type: string, status: string): string {
  switch (type) {
    case "room_message": return "replied in the chat room";
    case "task_received": return "received a request";
    case "task_transition": return `moved the task to “${taskStatusName(status)}”`;
    case "approval_requested": return "asked for approval";
    case "approval_decision": return status.toLowerCase().replace(/^(\w)/, (c) => c.toUpperCase()).replace(/\(by chat reply.*$/i, "(by chat reply)").trim();
    case "plugin_inspection": return `inspected a design: ${withCanvaLabels(status)}`;
    case "plugin_execution": return `applied the approved change: ${withCanvaLabels(status)}`;
    case "resource_transition": return `${status === "COMPLETED" ? "verified" : status === "FAILED" ? "could not verify" : "updated"} a resource`;
    case "vet": { const m = /^(.+?) review: (.*)$/s.exec(status); return m ? `finished a ${reviewKindName(m[1]).toLowerCase().replace(/^(figma|canva|github)/, (p) => providerName(p))}: ${withCanvaLabels(m[2])}` : withCanvaLabels(status); }
    default: return `${type.replaceAll("_", " ")}${status ? `: ${taskStatusName(status)}` : ""}`;
  }
}
