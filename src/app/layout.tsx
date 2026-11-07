import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { readTheme } from "@/components/theme/read-theme";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.MARKPATH_PUBLIC_URL || "https://markpath.vercel.app"),
  title: "Markpath",
  description: "Your brand, kept on-brand by a team of agents in Switch.",
  openGraph: { title: "Markpath", description: "Your brand, kept on-brand by a team of agents in Switch.", url: "/", siteName: "Markpath", type: "website" },
  twitter: { card: "summary_large_image", title: "Markpath", description: "Your brand, kept on-brand by a team of agents in Switch." }
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8f8f7" }, { media: "(prefers-color-scheme: dark)", color: "#0d0e10" }],
  colorScheme: "light dark"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The saved theme (cookie) is rendered on the server, so the first paint is already right: no flash.
  const theme = await readTheme();
  return <html className={`${sans.variable} ${mono.variable}`} data-theme={theme} lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
