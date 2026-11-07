import type { ComponentType, SVGProps } from "react";
import * as H from "@heroicons/react/24/outline";
import { siDiscord, siGithub, siTelegram } from "simple-icons";

// Interface icons: Heroicons (MIT). Brand logos: Simple Icons (CC0) and the official Figma, Slack and Canva marks.
type IconProps = SVGProps<SVGSVGElement> & { size?: number };
type Hero = ComponentType<SVGProps<SVGSVGElement>>;
const hero = (Icon: Hero) => function HeroIcon({ size = 16, ...rest }: IconProps) { return <Icon aria-hidden height={size} strokeWidth={1.6} width={size} {...rest} />; };

function base({ size = 16, className, ...rest }: IconProps) {
  return { "aria-hidden": true, className, fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.5, viewBox: "0 0 24 24", width: size, ...rest };
}
function mark({ size = 16, className, ...rest }: IconProps) {
  return { "aria-hidden": true, className, fill: "currentColor", height: size, viewBox: "0 0 24 24", width: size, ...rest };
}

export const CheckIcon = hero(H.CheckIcon);
export const ChevronRight = hero(H.ChevronRightIcon);
export const ChevronDown = hero(H.ChevronDownIcon);
export const ArrowRight = hero(H.ArrowRightIcon);
export const AlertIcon = hero(H.ExclamationTriangleIcon);
export const ClockIcon = hero(H.ClockIcon);
export const ShieldIcon = hero(H.ShieldCheckIcon);
export const InboxIcon = hero(H.InboxIcon);
export const ActivityIcon = hero(H.BoltIcon);
export const SearchIcon = hero(H.MagnifyingGlassIcon);
export const SwatchIcon = hero(H.SwatchIcon);
export const ExternalIcon = hero(H.ArrowTopRightOnSquareIcon);
export const RefreshIcon = hero(H.ArrowPathIcon);
export const CopyIcon = hero(H.DocumentDuplicateIcon);
export const UploadIcon = hero(H.ArrowUpTrayIcon);
export const MenuIcon = hero(H.Bars3Icon);
export const CloseIcon = hero(H.XMarkIcon);
export const PlusIcon = hero(H.PlusIcon);
export const HomeIcon = hero(H.HomeIcon);
export const PlugIcon = hero(H.PuzzlePieceIcon);
export const EyeCheckIcon = hero(H.DocumentMagnifyingGlassIcon);
export const SelectorIcon = hero(H.ChevronUpDownIcon);
export const LogoutIcon = hero(H.ArrowRightStartOnRectangleIcon);
export const SunIcon = hero(H.SunIcon);
export const MoonIcon = hero(H.MoonIcon);
export const MonitorIcon = hero(H.ComputerDesktopIcon);
export const EyeIcon = hero(H.EyeIcon);
export const EyeOffIcon = hero(H.EyeSlashIcon);
export const SidebarIcon = (p: IconProps) => <svg {...base(p)}><rect height="16" rx="2.5" width="18" x="3" y="4" /><path d="M9 4v16" /></svg>;
export const SpinnerIcon = (p: IconProps) => <svg {...base(p)} className={`spin ${p.className ?? ""}`}><path d="M12 3a9 9 0 109 9" /></svg>;
export const ChatIcon = (p: IconProps) => <svg {...base(p)}><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 10h8M8 13h5" /></svg>;
export const BrandIcon = (p: IconProps) => <svg {...base(p)}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4z" /><circle cx="16.5" cy="16.5" r="3.5" /></svg>;

const simple = (path: string, fill: string) => function SimpleLogo(p: IconProps) { return <svg {...mark(p)} fill={fill}><path d={path} /></svg>; };
export const GithubIcon = simple(siGithub.path, "currentColor");
export const DiscordIcon = simple(siDiscord.path, `#${siDiscord.hex}`);
export const TelegramIcon = simple(siTelegram.path, `#${siTelegram.hex}`);
export const FigmaIcon = (p: IconProps) => <svg {...mark(p)} viewBox="0 0 38 57"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE" /><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83" /><path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262" /><path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E" /><path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF" /></svg>;
export const SlackIcon = (p: IconProps) => <svg {...mark(p)} viewBox="0 0 122.8 122.8"><path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A" /><path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0" /><path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D" /><path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E" /></svg>;
export const CanvaIcon = (p: IconProps) => <svg {...mark(p)}><defs><linearGradient id="mp-canva" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#00C4CC" /><stop offset="0.55" stopColor="#5A32FA" /><stop offset="1" stopColor="#7D2AE8" /></linearGradient></defs><circle cx="12" cy="12" r="11" fill="url(#mp-canva)" /><path d="M15.6 15.1a4.6 4.6 0 1 1 .2-6" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2.2" /></svg>;
export const TeamsIcon = (p: IconProps) => <svg {...mark(p)} fill="#5059C9"><circle cx="18.6" cy="5.6" r="2.4" /><path d="M16.2 9.2H21a1 1 0 011 1v4.6a3.6 3.6 0 01-5.8 2.8z" /><rect height="14" rx="2.5" width="14" x="2" y="5" /><path d="M5.8 9h6.4M9 9v7" fill="none" stroke="var(--color-surface)" strokeLinecap="round" strokeWidth="1.8" /></svg>;

/** A tool's logo. In colour when connected; grey and faded when it isn't, so the state reads at a glance. */
export function ProviderIcon({ provider, connected = true, className = "", ...p }: IconProps & { provider?: string | null; connected?: boolean }) {
  const cls = `${className} ${connected ? "" : "opacity-45 grayscale"}`.trim();
  switch (provider) {
    case "github": return <GithubIcon className={cls} {...p} />;
    case "figma": return <FigmaIcon className={cls} {...p} />;
    case "canva": return <CanvaIcon className={cls} {...p} />;
    case "switch": return <ChatIcon className={cls} {...p} />;
    case "slack": return <SlackIcon className={cls} {...p} />;
    case "discord": return <DiscordIcon className={cls} {...p} />;
    case "telegram": return <TelegramIcon className={cls} {...p} />;
    case "teams": return <TeamsIcon className={cls} {...p} />;
    default: return <BrandIcon className={cls} {...p} />;
  }
}
