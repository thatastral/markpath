"use client";
import { useEffect } from "react";

/** Drops ?saved= and ?problem= from the address after the notice has shown, so a reload doesn't show it again. */
export function SetupClearNotice() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("saved") && !url.searchParams.has("problem")) return;
    url.searchParams.delete("saved"); url.searchParams.delete("problem");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
  return null;
}
