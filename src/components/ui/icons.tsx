import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, className, ...rest }: IconProps) {
  return { "aria-hidden": true, className, fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.75, viewBox: "0 0 24 24", width: size, ...rest };
}

export const CheckIcon = (p: IconProps) => <svg {...base(p)} strokeWidth={2.5}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
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
export const SpinnerIcon = (p: IconProps) => <svg {...base(p)} className={`spin ${p.className ?? ""}`}><path d="M12 3a9 9 0 109 9" /></svg>;

/** Provider glyphs: simple, recognisable shapes in currentColor (not brand logos). */
export const GithubIcon = (p: IconProps) => <svg {...base(p)}><path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 00-6.2 0C6.6 2.8 5.6 3.1 5.6 3.1a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 004.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" /></svg>;
export const FigmaIcon = (p: IconProps) => <svg {...base(p)}><path d="M9 3h3v6H9a3 3 0 010-6zM12 3h3a3 3 0 010 6h-3V3zM9 9h3v6H9a3 3 0 010-6zM9 15h3v3a3 3 0 11-3-3z" /><circle cx="15" cy="12" r="3" /></svg>;
export const CanvaIcon = (p: IconProps) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M15 9.5a3.5 3.5 0 100 5" /></svg>;
export const ChatIcon = (p: IconProps) => <svg {...base(p)}><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 10h8M8 13h5" /></svg>;
export const BrandIcon = (p: IconProps) => <svg {...base(p)}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4z" /><circle cx="16.5" cy="16.5" r="3.5" /></svg>;

export function ProviderIcon({ provider, ...p }: IconProps & { provider?: string | null }) {
  switch (provider) {
    case "github": return <GithubIcon {...p} />;
    case "figma": return <FigmaIcon {...p} />;
    case "canva": return <CanvaIcon {...p} />;
    case "switch": return <ChatIcon {...p} />;
    default: return <BrandIcon {...p} />;
  }
}
