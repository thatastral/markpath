import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Markpath",
  description: "Brand operations control centre"
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f7f9" }, { media: "(prefers-color-scheme: dark)", color: "#0b0d12" }]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html className={`${sans.variable} ${mono.variable}`} lang="en"><body>{children}</body></html>;
}
