import type Database from "better-sqlite3";
import { getIntegrations, switchRoomReplyCount } from "@/server/dashboard/service";
import { getGithubConfig } from "@/server/integrations/github";
import { figmaMcpConfig } from "@/server/integrations/figma";
import { canvaMcpConfig } from "@/server/integrations/canva";
import { HttpSwitchClient, type SwitchClient } from "@/server/switch/client";
import { whenText } from "@/lib/labels";

export type SetupStatus = "done" | "needs_you" | "optional" | "not_started";
export type SetupKey = "brand" | "github" | "figma" | "canva" | "chat" | "check";
export type SetupStep = {
  n: number; key: SetupKey; title: string; why: string; status: SetupStatus; optional: boolean;
  /** Shown with a green check once the step works: proof from real data. */
  evidence: string | null;
  /** What the person needs to do next, in plain words. */
  next: string | null;
  /** What to have ready before starting, and roughly how long it takes. */
  needs: string; time: string;
};
export type SetupData = {
  steps: SetupStep[];
  requiredLeft: number;
  context: {
    teamPrefix: string; chatHandle: string; roomReplies: number; switchReachable: boolean;
    github: { login: string; repo: string | null } | null;
    figma: { url: string; status: string } | null;
    canva: { url: string; status: string } | null;
  };
};

export const setupStatusLabel: Record<SetupStatus, string> = { done: "Done", needs_you: "Needs you", optional: "Optional", not_started: "Not started" };

const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);
const count = (db: Database.Database, sql: string, ...args: unknown[]) => (db.prepare(sql).get(...args) as { n: number }).n;

/** The six setup steps and their status, computed from real data. Shared by Overview and Integrations. */
export async function getSetupData(db: Database.Database, brandId: string, userId: string, switchClient: SwitchClient = new HttpSwitchClient()): Promise<SetupData> {
  const brand = db.prepare("SELECT brand_version, team_prefix FROM brands WHERE id = ?").get(brandId) as { brand_version: string; team_prefix: string };
  const approved = db.prepare("SELECT version, approved_at FROM brand_spec_versions WHERE brand_id = ? AND status = 'approved' ORDER BY approved_at DESC LIMIT 1").get(brandId) as { version: string; approved_at: string | null } | undefined;
  const waitingRules = count(db, "SELECT COUNT(*) AS n FROM brand_spec_versions WHERE brand_id = ? AND status = 'extracted'", brandId);
  const integrations = getIntegrations(db, brandId);
  const lastUsed = (provider: string) => integrations.find((i) => i.provider === provider)?.last_checked_at ?? null;
  const gh = getGithubConfig(brandId); const figma = figmaMcpConfig(brandId); const canva = canvaMcpConfig(brandId);
  const roomReplies = switchRoomReplyCount(db, brandId);
  const chatHandle = (db.prepare("SELECT handle FROM chat_identities WHERE brand_id = ? AND user_id = ?").get(brandId, userId) as { handle: string } | undefined)?.handle ?? "";
  const health = await switchClient.health();
  const checks = count(db, "SELECT COUNT(*) AS n FROM tasks WHERE brand_id = ?", brandId) + count(db, "SELECT COUNT(*) AS n FROM vet_reports WHERE brand_id = ?", brandId);
  const issues = count(db, "SELECT COUNT(*) AS n FROM findings WHERE brand_id = ? AND classification != 'compliant'", brandId);
  const prefix = brand.team_prefix;

  const rulesDone = brand.brand_version !== "0.0";
  const designStep = (n: number, key: "figma" | "canva", title: string, why: string, cfg: { status: string } | null, noun: string, needs: string): SetupStep => {
    const read = cfg?.status === "connected";
    return {
      n, key, title, why, optional: true, needs, time: "About 3 minutes",
      status: read ? "done" : cfg ? "needs_you" : "optional",
      evidence: read ? `The Design agent has read this ${noun}${lastUsed(key) ? ` (last read ${whenText(lastUsed(key))})` : ""}.` : null,
      next: cfg?.status === "error" ? `The Design agent couldn't open this ${noun}. Check the link and that the agents' account can edit it.` : cfg ? `Saved. This turns green after the Design agent reads the ${noun}: ask for a check in the chat room.` : null,
    };
  };

  const steps: SetupStep[] = [
    {
      n: 1, key: "brand", title: "Brand rules approved", optional: false,
      needs: "Your brand guideline as a PDF or document.", time: "About 5 minutes",
      why: "The agents check everything against the rules you approve, so this comes first.",
      status: rulesDone ? "done" : waitingRules > 0 ? "needs_you" : "not_started",
      evidence: rulesDone ? `Version ${brand.brand_version} approved${approved?.approved_at ? ` on ${whenText(approved.approved_at)}` : ""}.` : null,
      next: rulesDone ? null : waitingRules > 0 ? "Markpath found rules in your guideline. Review and approve them." : "Upload your brand guideline. Markpath reads the rules out of it for you to approve.",
    },
    {
      n: 2, key: "github", title: "GitHub", optional: false,
      needs: "A GitHub account that can make changes to your website or app's code.", time: "About 2 minutes",
      why: "So approved fixes to your website or app open as pull requests you can review.",
      status: gh?.repo ? "done" : gh ? "needs_you" : "not_started",
      evidence: gh?.repo ? `Connected as ${gh.login}, repository ${gh.repo}.` : null,
      next: gh?.repo ? null : gh ? `Signed in as ${gh.login}. Choose a repository.` : "Sign in with GitHub, then choose a repository.",
    },
    designStep(3, "figma", "Figma file", "So the Design agent can check a Figma file and fix off-brand colours, fonts and corners.", figma, "file", "A Figma account with edit access to the file (a paid seat), and the link to the file."),
    designStep(4, "canva", "Canva design", "So the Design agent can check a Canva design and fix off-brand colours and wording.", canva, "design", "A Canva account that can edit the design, and the link to the design."),
    {
      n: 5, key: "chat", title: "Chat room", optional: false,
      needs: "Switch running, and admin rights in a Discord server or Slack workspace (or a Telegram group).", time: "About 15 minutes",
      why: "Your team talks to the agents and approves changes in one chat room.",
      status: roomReplies > 0 ? "done" : health.connected ? "needs_you" : "not_started",
      evidence: roomReplies > 0 ? `An agent answered in the room ${times(roomReplies)}.` : null,
      next: roomReplies > 0 ? (chatHandle ? null : "Add your chat handle below so you can approve by replying in the room.") : `Send "@${prefix}-director what's the status?" in the room. This step turns green when an agent answers.`,
    },
    {
      n: 6, key: "check", title: "First check run", optional: false,
      needs: "Steps 1 and 5 done.", time: "About 2 minutes",
      why: "A first check shows what is off-brand today and proves everything works together.",
      status: checks > 0 ? "done" : "not_started",
      evidence: checks > 0 ? `${checks === 1 ? "1 check" : `${checks} checks`} run, ${issues === 1 ? "1 issue" : `${issues} issues`} found.` : null,
      next: checks > 0 ? null : `In the chat room, send "@${prefix}-director check our brand".`,
    },
  ];
  return {
    steps,
    requiredLeft: steps.filter((s) => !s.optional && s.status !== "done").length,
    context: { teamPrefix: prefix, chatHandle, roomReplies, switchReachable: health.connected, github: gh ? { login: gh.login, repo: gh.repo ?? null } : null, figma, canva },
  };
}
