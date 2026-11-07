import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, className, ...rest }: IconProps) {
  return { "aria-hidden": true, className, fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.5, viewBox: "0 0 24 24", width: size, ...rest };
}

export const CheckIcon = (p: IconProps) => <svg {...base(p)} strokeWidth={2}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const ChevronRight = (p: IconProps) => <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>;
export const ArrowRight = (p: IconProps) => <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const AlertIcon = (p: IconProps) => <svg {...base(p)}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>;
export const ClockIcon = (p: IconProps) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const ShieldIcon = (p: IconProps) => <svg {...base(p)}><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>;
export const InboxIcon = (p: IconProps) => <svg {...base(p)}><path d="M4 13l2.5-7h11L20 13v6H4v-6z" /><path d="M4 13h4.5l1 2h5l1-2H20" /></svg>;
export const ActivityIcon = (p: IconProps) => <svg {...base(p)}><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>;
export const SearchIcon = (p: IconProps) => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const SwatchIcon = (p: IconProps) => <svg {...base(p)}><path d="M12 3a9 9 0 100 18c1 0 1.5-.7 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-1.5 2-1.5H17a4 4 0 004-4c0-4.7-4-8.5-9-8.5z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></svg>;
export const ExternalIcon = (p: IconProps) => <svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></svg>;
export const RefreshIcon = (p: IconProps) => <svg {...base(p)}><path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" /></svg>;
export const CopyIcon = (p: IconProps) => <svg {...base(p)}><rect height="12" rx="2" width="12" x="8" y="8" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></svg>;
export const UploadIcon = (p: IconProps) => <svg {...base(p)}><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>;
export const MenuIcon = (p: IconProps) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const CloseIcon = (p: IconProps) => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const PlusIcon = (p: IconProps) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>;
export const HomeIcon = (p: IconProps) => <svg {...base(p)}><path d="M4 10.5L12 4l8 6.5V19a1 1 0 01-1 1h-4.5v-6h-5v6H5a1 1 0 01-1-1v-8.5z" /></svg>;
export const PlugIcon = (p: IconProps) => <svg {...base(p)}><path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 01-10 0V8zM12 16v5" /></svg>;
export const EyeCheckIcon = (p: IconProps) => <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12.2l2.4 2.4 4.6-4.9" /></svg>;
export const ChevronDown = (p: IconProps) => <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>;
export const SelectorIcon = (p: IconProps) => <svg {...base(p)}><path d="M8 9l4-4 4 4M8 15l4 4 4-4" /></svg>;
export const LogoutIcon = (p: IconProps) => <svg {...base(p)}><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 16l-4-4 4-4M6 12h10" /></svg>;
export const SunIcon = (p: IconProps) => <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" /></svg>;
export const MoonIcon = (p: IconProps) => <svg {...base(p)}><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" /></svg>;
export const MonitorIcon = (p: IconProps) => <svg {...base(p)}><rect height="12" rx="2" width="18" x="3" y="4" /><path d="M8 20h8M12 16v4" /></svg>;
export const EyeIcon = (p: IconProps) => <svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>;
export const EyeOffIcon = (p: IconProps) => <svg {...base(p)}><path d="M10.6 5.6A9.6 9.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 01-2.8 3.6M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.4-.6 4.7-1.4M9.9 9.9a3 3 0 004.2 4.2M3 3l18 18" /></svg>;
export const SidebarIcon = (p: IconProps) => <svg {...base(p)}><rect height="16" rx="2.5" width="18" x="3" y="4" /><path d="M9 4v16" /></svg>;
export const SpinnerIcon = (p: IconProps) => <svg {...base(p)} className={`spin ${p.className ?? ""}`}><path d="M12 3a9 9 0 109 9" /></svg>;

/** Provider marks: simplified, recognisable monochrome logos in currentColor. */
function mark({ size = 16, className, ...rest }: IconProps) {
  return { "aria-hidden": true, className, fill: "currentColor", height: size, viewBox: "0 0 24 24", width: size, ...rest };
}
export const GithubIcon = (p: IconProps) => <svg {...mark(p)}><path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .3" /></svg>;
export const FigmaIcon = (p: IconProps) => <svg {...mark(p)}><path d="M8.3 1.5h3.7v7H8.3a3.5 3.5 0 010-7zM12 1.5h3.7a3.5 3.5 0 010 7H12zM8.3 8.5H12v7H8.3a3.5 3.5 0 010-7zM8.3 15.5H12V19a3.5 3.5 0 11-3.7-3.5z" /><circle cx="15.7" cy="12" r="3.5" /></svg>;
export const CanvaIcon = (p: IconProps) => <svg {...mark(p)}><circle cx="12" cy="12" r="10.5" /><path d="M15.6 15.2a4.6 4.6 0 01-3.4 1.6c-2.6 0-4.4-2-4.4-4.8 0-3 2.1-5 4.6-5 1.3 0 2.4.5 2.9 1.2" fill="none" stroke="var(--color-surface)" strokeLinecap="round" strokeWidth="2" /></svg>;
export const SlackIcon = (p: IconProps) => <svg {...mark(p)}><rect height="9" rx="1.6" width="3.2" x="8.6" y="2" /><rect height="3.2" rx="1.6" width="3.2" x="12.8" y="2" /><rect height="3.2" rx="1.6" width="9" x="13" y="8.6" /><rect height="3.2" rx="1.6" width="3.2" x="18.8" y="12.8" /><rect height="9" rx="1.6" width="3.2" x="12.2" y="13" /><rect height="3.2" rx="1.6" width="3.2" x="8" y="18.8" /><rect height="3.2" rx="1.6" width="9" x="2" y="12.2" /><rect height="3.2" rx="1.6" width="3.2" x="2" y="8" /></svg>;
export const DiscordIcon = (p: IconProps) => <svg {...mark(p)}><path clipRule="evenodd" d="M19.3 5.3A16.6 16.6 0 0015.2 4l-.5 1a15.4 15.4 0 00-5.4 0l-.5-1a16.6 16.6 0 00-4.1 1.3C2.1 9.2 1.4 13 1.8 16.7a16.7 16.7 0 005 2.5l1.1-1.7a10.8 10.8 0 01-1.7-.8l.4-.3a11.9 11.9 0 0010.8 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a16.6 16.6 0 005-2.5c.5-4.3-.7-8-3-11.4zM8.7 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" fillRule="evenodd" /></svg>;
export const TelegramIcon = (p: IconProps) => <svg {...mark(p)}><circle cx="12" cy="12" r="10.5" /><path d="M6.4 11.8l10.1-3.9c.5-.2.9.1.7.8l-1.7 8c-.1.6-.5.7-1 .4l-2.6-1.9-1.3 1.2c-.1.1-.3.3-.6.3l.2-2.7 4.8-4.4c.2-.2 0-.3-.3-.1l-6 3.8-2.6-.8c-.6-.2-.6-.6.3-.7z" fill="var(--color-surface)" /></svg>;
export const TeamsIcon = (p: IconProps) => <svg {...mark(p)}><circle cx="18.6" cy="5.6" r="2.4" /><path d="M16.2 9.2H21a1 1 0 011 1v4.6a3.6 3.6 0 01-5.8 2.8z" /><rect height="14" rx="2.5" width="14" x="2" y="5" /><path d="M5.8 9h6.4M9 9v7" fill="none" stroke="var(--color-surface)" strokeLinecap="round" strokeWidth="1.8" /></svg>;
export const ChatIcon = (p: IconProps) => <svg {...base(p)}><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 10h8M8 13h5" /></svg>;
export const BrandIcon = (p: IconProps) => <svg {...base(p)}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4z" /><circle cx="16.5" cy="16.5" r="3.5" /></svg>;

export function ProviderIcon({ provider, ...p }: IconProps & { provider?: string | null }) {
  switch (provider) {
    case "github": return <GithubIcon {...p} />;
    case "figma": return <FigmaIcon {...p} />;
    case "canva": return <CanvaIcon {...p} />;
    case "switch": return <ChatIcon {...p} />;
    case "slack": return <SlackIcon {...p} />;
    case "discord": return <DiscordIcon {...p} />;
    case "telegram": return <TelegramIcon {...p} />;
    case "teams": return <TeamsIcon {...p} />;
    default: return <BrandIcon {...p} />;
  }
}
