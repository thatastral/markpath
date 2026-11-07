import Link from "next/link";
import { Logo } from "@/components/main-nav";
import { buttonClass, EmptyArt } from "@/components/ui/primitives";
import { SearchIcon } from "@/components/ui/icons";

export default function NotFound() {
  return <main className="anim-rise grid min-h-dvh place-items-center bg-canvas px-6 text-center">
    <div className="w-full max-w-sm">
      <div className="mb-10 flex justify-center"><Logo /></div>
      <EmptyArt icon={<SearchIcon />} label="404" />
      <h1 className="mt-6 text-base font-semibold tracking-tight">We can&apos;t find that page</h1>
      <p className="mt-1 text-sm text-muted">The link may be old, or the item may belong to a different workspace.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><Link className={buttonClass("primary")} href="/">Go to Overview</Link><Link className={buttonClass("secondary")} href="/issues">See issues</Link></div>
    </div>
  </main>;
}
