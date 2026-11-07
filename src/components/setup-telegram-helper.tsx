"use client";
import { useState } from "react";
import { SetupCopyButton } from "@/components/setup-copy-button";
import { SetupExternalLink } from "@/components/setup-external-link";
import { inputClass } from "@/components/ui/primitives";

/** Cuts the Telegram setup down: copyable BotFather commands and a one-tap "add to group" link for the new bot. */
export function SetupTelegramHelper() {
  const [name, setName] = useState("");
  const bot = name.trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");
  const valid = /^[A-Za-z][A-Za-z0-9_]{3,31}bot$/i.test(bot);
  return <div className="mt-3 space-y-3 rounded-control border border-border p-3">
    <p className="text-xs text-muted">Send these to BotFather, in order:</p>
    <div className="flex flex-wrap gap-2"><SetupCopyButton label="/newbot" value="/newbot" /><SetupCopyButton label="/setprivacy" value="/setprivacy" /></div>
    <p className="text-xs text-muted">For /setprivacy, pick your bot, then Disable, so it can read the group.</p>
    <label className="block space-y-1.5"><span className="text-xs font-medium">Your bot&apos;s username</span>
      <input className={inputClass} onChange={(e) => setName(e.target.value)} placeholder="e.g. acme_brand_bot" spellCheck={false} value={name} autoComplete="off" /></label>
    {bot && !valid && <p className="text-xs text-danger">Telegram bot usernames end in “bot”, like acme_brand_bot.</p>}
    {valid && <SetupExternalLink button href={`https://t.me/${bot}?startgroup=markpath`}>Add @{bot} to a group</SetupExternalLink>}
  </div>;
}
