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
  // Letters show the error straight away; a too-short number waits until the person leaves the field.
  const error = clean === "" || valid ? "" : /\D/.test(clean) ? "Application IDs are numbers only. Copy it again from the Developer Portal." : touched ? "Application IDs are 17 to 20 digits. Copy the whole ID from the Developer Portal." : "";
  return (
    <div className="mt-3 grid gap-3 rounded-control border border-border bg-surface p-3 sm:p-4">
      <div className="grid gap-1">
        <label className="font-medium" htmlFor={`${id}-app`}>Discord Application ID</label>
        <input aria-describedby={`${id}-help${error ? ` ${id}-err` : ""}`} aria-invalid={error ? true : undefined} autoComplete="off" className={`w-full min-w-0 rounded-control border bg-surface px-3 py-2 font-mono text-[16px] tabular-nums sm:max-w-xs sm:text-sm ${error ? "border-danger" : "border-border-strong"} ${focus}`} id={`${id}-app`} inputMode="numeric" onBlur={() => setTouched(true)} onChange={(e) => { setValue(e.target.value); if (/^\d{17,20}$/.test(e.target.value.trim())) setTouched(true); }} placeholder="123456789012345678" value={value} />
        <span className="text-muted" id={`${id}-help`}>Find it on your app&apos;s General Information page in the Developer Portal. The &quot;Add the bot&quot; button appears once the ID looks right.</span>
        {error && <span className="text-danger" id={`${id}-err`} role="alert">{error}</span>}
      </div>
      {valid && <a className={`press anim-rise inline-flex min-h-10 w-fit items-center gap-1.5 rounded-control bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid-hover lg:min-h-8 ${focus}`} href={discordInviteUrl(clean)} rel="noopener noreferrer" target="_blank">Add the bot to your server<ExternalIcon size={14} /><span className="sr-only">(opens in a new tab)</span></a>}
      <fieldset className="grid gap-2">
        <legend className="font-medium">Before you add the bot, check its settings:</legend>
        <label className="flex items-start gap-2"><input className="mt-0.5" type="checkbox" />Server Members intent is on</label>
        <label className="flex items-start gap-2"><input className="mt-0.5" type="checkbox" />Message Content intent is on</label>
        <span className="text-muted">A checklist for you. Markpath doesn&apos;t save it.</span>
      </fieldset>
    </div>
  );
}
