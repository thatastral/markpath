import { ChevronRight, ProviderIcon } from "@/components/ui/icons";
import { SetupDiscordInvite } from "@/components/setup-discord-invite";
import { SetupExternalLink } from "@/components/setup-external-link";

const SWITCH_GUIDES = "https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps";

const apps = [
  { name: "Discord", tag: "Quickest", time: "About 10 min", open: { href: "https://discord.com/developers/applications", label: "Open Discord Developer Portal" }, needs: "A Discord account that can manage a server.", steps: ["Create an application, add a bot and copy its bot token.", "In the bot settings, turn on the Server Members and Message Content intents.", "Paste the Application ID below, then add the bot to your server.", "In Switch Console, open Messaging apps, then Connect, then Discord. Paste the bot token and server ID, link your account and post in a channel."], discord: true },
  { name: "Slack", tag: null, time: "About 15 min", open: { href: "https://api.slack.com/apps", label: "Open Slack apps" }, needs: "A Slack workspace where you can add apps. An admin may need to approve it.", steps: ["Create the app from the manifest in Switch's Slack guide.", "Create the app-level token, install the app, then copy the bot token and workspace ID.", "In Switch Console, open Messaging apps, then Connect, then Slack. Paste the tokens.", "Link your account, then add Switch to a channel."], discord: false },
  { name: "Telegram", tag: null, time: "About 10 min", open: { href: "https://t.me/BotFather", label: "Open BotFather" }, needs: "A Telegram account and a group you manage.", steps: ["Create a bot with BotFather and copy its token.", "Turn Group Privacy off, then add the bot to your group.", "In Switch Console, open Messaging apps, then Connect, then Telegram. Paste the token.", "Post in the group, then link your account with your @username."], discord: false },
  { name: "Microsoft Teams", tag: "Needs IT admin", time: "1 hour or more", open: { href: "https://dev.teams.microsoft.com/apps", label: "Open Teams Developer Portal" }, needs: "A Microsoft 365 admin, and a public web address for Switch.", steps: ["Ask a Microsoft 365 admin to create the Azure bot and approve its permissions.", "Make Switch reachable on a public HTTPS address (messages arrive at /api/messages).", "Upload the Teams app package, then connect it in Switch Console with the app ID, secret, tenant, team and public address.", "Link your account and add the app to the channel."], discord: false },
];

export function ChatApps() {
  return (
    <div className="mt-1 text-sm">
      <p className="text-muted">Agents and approvals work the same in every app. Pick one, then connect it in Switch Console.</p>
      <div className="mt-2 grid gap-2">
        {apps.map((a) => (
          <details className="group rounded-control border border-border bg-surface px-3" key={a.name}>
            <summary className="flex min-h-10 cursor-pointer flex-wrap items-center gap-2 py-2 font-medium"><ChevronRight className="chev shrink-0 text-muted" size={14} /><ProviderIcon className="shrink-0" provider={a.name === "Microsoft Teams" ? "teams" : a.name.toLowerCase()} />{a.name}{a.tag && <span className={`inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium ${a.discord ? "border-brand/40 text-brand" : "border-border text-muted"}`}>{a.tag}</span>}<span className="ml-auto text-xs font-normal tabular-nums text-muted">{a.time}</span></summary>
            <p className="mt-2"><span className="font-medium">You&apos;ll need:</span> <span className="text-muted">{a.needs}</span></p>
            <p className="mt-2"><SetupExternalLink button href={a.open.href}>{a.open.label}</SetupExternalLink></p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 marker:text-muted marker:tabular-nums">{a.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            {a.discord && <SetupDiscordInvite />}
            <p className="mb-2 mt-2 text-muted">Stuck? See the <SetupExternalLink href={SWITCH_GUIDES}>Switch messaging app guides</SetupExternalLink>.</p>
          </details>
        ))}
      </div>
    </div>
  );
}
