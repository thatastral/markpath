import Link from "next/link";
import { Logo } from "@/components/main-nav";
import { buttonClass } from "@/components/ui/primitives";

export default function NotFound() {
  return <main className="anim-rise mx-auto grid min-h-screen max-w-md place-content-center px-6 text-center">
    <div className="flex justify-center"><Logo /></div>
    <p className="mt-6 font-mono text-sm text-muted">404</p>
    <h1 className="mt-1 text-2xl font-semibold tracking-tight">We can&apos;t find that page</h1>
    <p className="mt-2 text-muted">The link may be old, or the item may belong to a different workspace.</p>
    <div className="mt-6"><Link className={buttonClass("primary")} href="/">Go to your overview</Link></div>
  </main>;
}
