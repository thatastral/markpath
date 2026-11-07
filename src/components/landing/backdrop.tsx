/** Decorative landing backdrop: a fine, slowly drifting dot field. */
export function LandingBackdrop() {
  return <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
    <div className="mp-dots absolute inset-0 text-border-strong opacity-40 [mask-image:linear-gradient(to_bottom,black,black_55%,transparent_92%)]" />
  </div>;
}
