import { cookies } from "next/headers";
import { asTheme, THEME_COOKIE, type Theme } from "./theme";

/** Server-side: the person's saved theme, so <html data-theme> is right on the first paint. */
export async function readTheme(): Promise<Theme> {
  return asTheme((await cookies()).get(THEME_COOKIE)?.value);
}
