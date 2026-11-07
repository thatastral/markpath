const apps = [
  { name: "Telegram", needs: "A bot from @BotFather. No public address.", steps: ["Create a bot with @BotFather and copy its token.", "Turn Group Privacy off before adding the bot to a group.", "In Switch Console: Home, Messaging apps, Connect, Telegram. Paste the token.", "Post in the group, then link your account (your @username)."], doc: "setup-telegram.md" },
  { name: "Slack", needs: "A Slack app from Switch's manifest (Socket Mode). No public address. A workspace admin may need to approve it.", steps: ["Create the app from the manifest in Switch's Slack guide.", "Generate the app-level token, install the app, copy the bot token and workspace id.", "In Switch Console: Messaging apps, Connect, Slack. Paste the tokens.", "Link your account, then bring Switch into a channel."], doc: "setup-slack.md" },
  { name: "Discord", needs: "A bot from the Discord Developer Portal. No public address.", steps: ["Create an application and bot, copy the bot token.", "Turn on the Server Members and Message Content intents.", "Invite the bot with both the bot and applications.commands scopes.", "In Switch Console: Messaging apps, Connect, Discord. Paste the token and server id, then link your account and post in a channel."], doc: "setup-discord.md" },
  { name: "Microsoft Teams", needs: "An Azure bot, admin-consented permissions and a public HTTPS address for Switch. The most work of the four.", steps: ["Ask a Microsoft 365 admin to create the Azure bot and grant the Graph permissions.", "Expose Switch over HTTPS (messages arrive at /api/messages).", "Upload the Teams app package, then connect it in Switch Console with the app id, secret, tenant, team and public URL.", "Link your account and add the app to the channel."], doc: "setup-teams.md" },
];

export function ChatApps() {
  return (
    <div className="mt-4 text-sm">
      <p className="font-medium">Use a different chat app</p>
      <p className="mt-1 text-muted">The agents and approvals work the same in every app. Pick one, connect it in Switch Console, then create the room from the template above and choose that app.</p>
      <div className="mt-2 grid gap-2">
        {apps.map((a) => (
          <details className="rounded-[var(--radius-control)] border border-border px-3 py-2" key={a.name}>
            <summary className="cursor-pointer font-medium">{a.name}</summary>
            <p className="mt-2 text-muted">{a.needs}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">{a.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="mt-2 text-muted">Full guide: <code>docs/{a.doc}</code>. Not yet run end to end.</p>
          </details>
        ))}
      </div>
    </div>
  );
}
