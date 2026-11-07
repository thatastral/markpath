import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto grid min-h-screen max-w-md place-content-center px-6 text-center"><p className="text-sm font-semibold text-brand">Markpath</p><h1 className="mt-2 text-2xl font-semibold">We can't find that page</h1><p className="mt-2 text-muted">The link may be old, or the item may belong to a different workspace.</p><Link className="mt-5 inline-block rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white" href="/">Go to your overview</Link></main>;
}
