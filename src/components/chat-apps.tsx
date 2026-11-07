import { ChevronRight } from "@/components/ui/icons";
import { SetupDiscordInvite } from "@/components/setup-discord-invite";
import { SetupExternalLink } from "@/components/setup-external-link";

const SWITCH_GUIDES = "https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps";

const apps = [
  { name: "Discord", tag: "Recommended: quickest", time: "About 10 minutes", open: { href: "https://discord.com/developers/applications", label: "Open the Discord Developer Portal" }, needs: "A Discord account that can manage a server. No public address needed.", steps: ["In the Developer Portal, create an application, add a bot and copy the bot token.", "In the bot's settings, turn on the Server Members and Message Content intents.", "Paste the Application ID below to get a ready invite link, then add the bot to your server.", "In Switch Console: Messaging apps, Connect, Discord. Paste the token and server ID, then link your account and post in a channel."], doc: "setup-discord.md", discord: true },
  { name: "Slack", tag: null, time: "About 15 minutes", open: { href: "https://api.slack.com/apps", label: "Open Slack apps" }, needs: "A Slack workspace where you can add apps. A workspace admin may need to approve it. No public address needed.", steps: ["Create the app from the manifest in Switch's Slack guide.", "Make the app-level token, install the app, then copy the bot token and workspace ID.", "In Switch Console: Messaging apps, Connect, Slack. Paste the tokens.", "Link your account, then add Switch to a channel."], doc: "setup-slack.md", discord: false },
  { name: "Telegram", tag: null, time: "About 10 minutes", open: { href: "https://t.me/BotFather", label: "Open BotFather in Telegram" }, needs: "A Telegram account and a group you manage. No public address needed.", steps: ["Make a bot with BotFather and copy its token.", "Turn Group Privacy off before adding the bot to a group.", "In Switch Console: Home, Messaging apps, Connect, Telegram. Paste the token.", "Post in the group, then link your account (your @username)."], doc: "setup-telegram.md", discord: false },
  { name: "Microsoft Teams", tag: "Needs your IT admin", time: "An hour or more, with your IT admin", open: { href: "https://dev.teams.microsoft.com/apps", label: "Open the Teams Developer Portal" }, needs: "A Microsoft 365 admin, and a public web address for Switch. The most work of the four.", steps: ["Ask a Microsoft 365 admin to create the Azure bot and approve its permissions.", "Make Switch reachable on a public HTTPS address (messages arrive at /api/messages).", "Upload the Teams app package, then connect it in Switch Console with the app ID, secret, tenant, team and public address.", "Link your account and add the app to the channel."], doc: "setup-teams.md", discord: false },
];

export function ChatApps() {
  return (
    <div className="mt-1 text-sm">
      <p className="text-muted">The agents and approvals work the same in every app. Pick one, connect it in Switch Console, then create the room from the template and choose that app.</p>
      <div className="mt-2 grid gap-2">
        {apps.map((a) => (
          <details className="group rounded-control border border-border bg-surface px-3 open:shadow-card" key={a.name}>
            <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-2 py-2 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><ChevronRight className="chev shrink-0 text-muted" />{a.name}{a.tag && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.discord ? "bg-brand-soft text-brand" : "bg-subtle text-muted"}`}>{a.tag}</span>}<span className="ml-auto text-xs font-normal text-muted">{a.time}</span></summary>
            <p className="mt-2"><span className="font-medium">What you&apos;ll need:</span> <span className="text-muted">{a.needs}</span></p>
                        <p className="mt-2"><SetupExternalLink button href={a.open.href}>{a.open.label}</SetupExternalLink></p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 marker:text-muted">{a.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            {a.discord && <SetupDiscordInvite />}
            <p className="mb-2 mt-2 text-muted">Step-by-step help: <SetupExternalLink href={SWITCH_GUIDES}>Switch messaging app guides</SetupExternalLink>. Also in <code>docs/{a.doc}</code>. Not yet run end to end.</p>
          </details>
        ))}
      </div>
    </div>
  );
}
