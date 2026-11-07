/** Shared theme names and cookie. "system" follows the OS. */
export type Theme = "system" | "light" | "dark";
export const THEME_COOKIE = "mp-theme";
export const asTheme = (v: string | undefined | null): Theme => (v === "light" || v === "dark" ? v : "system");
