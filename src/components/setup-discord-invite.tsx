"use client";
import { useId, useState } from "react";
import { ExternalIcon } from "@/components/ui/icons";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
// View Channels, Send Messages, Send Messages in Threads, Manage Webhooks, Manage Channels, Manage Roles, Read Message History, Attach Files, Add Reactions.
const PERMISSIONS = [10n, 11n, 38n, 29n, 4n, 28n, 16n, 15n, 6n].reduce((sum, bit) => sum + (1n << bit), 0n).toString();
export const discordInviteUrl = (appId: string) => `https://discord.com/oauth2/authorize?client_id=${appId}&scope=bot%20applications.commands&permissions=${PERMISSIONS}`;

/** Builds the "add the bot to your server" link from a Discord Application ID. */
export function SetupDiscordInvite() {
  const id = useId();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const clean = value.trim();
  const valid = /^\d{17,20}$/.test(clean);
  const error = touched && clean !== "" && !valid ? "That doesn't look right. The Application ID is 17 to 20 digits, with no letters or spaces." : "";
  return (
    <div className="mt-3 grid gap-3 rounded-control border border-border bg-surface p-3 sm:p-4">
      <div className="grid gap-1">
        <label className="font-medium" htmlFor={`${id}-app`}>Discord Application ID</label>
        <input aria-describedby={`${id}-help${error ? ` ${id}-err` : ""}`} aria-invalid={error ? true : undefined} className={`w-full min-w-0 rounded-control border bg-surface px-3 py-2 font-mono text-sm sm:max-w-xs ${error ? "border-danger" : "border-border-strong"} ${focus}`} id={`${id}-app`} inputMode="numeric" onBlur={() => setTouched(true)} onChange={(e) => { setValue(e.target.value); if (/^\d{17,20}$/.test(e.target.value.trim())) setTouched(true); }} placeholder="123456789012345678" value={value} />
        <span className="text-muted" id={`${id}-help`}>In the Developer Portal, open your application. It&apos;s on the General Information page.</span>
        {error && <span className="text-danger" id={`${id}-err`} role="alert">{error}</span>}
      </div>
      {valid && <a className={`anim-rise inline-flex min-h-10 w-fit items-center gap-1.5 rounded-control bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid-hover ${focus}`} href={discordInviteUrl(clean)} rel="noopener noreferrer" target="_blank">Add the bot to your server<ExternalIcon size={14} /><span className="sr-only">(opens in a new tab)</span></a>}
      <fieldset className="grid gap-2">
        <legend className="font-medium">Before you invite it, in the bot&apos;s settings:</legend>
        <label className="flex items-start gap-2"><input className="mt-0.5" type="checkbox" />Turned on Server Members intent</label>
        <label className="flex items-start gap-2"><input className="mt-0.5" type="checkbox" />Turned on Message Content intent</label>
        <span className="text-muted">These are reminders for you. Markpath doesn&apos;t save them.</span>
      </fieldset>
    </div>
  );
}
