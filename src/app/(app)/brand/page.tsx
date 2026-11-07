import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { listBrandSpecVersions } from "@/server/db/repositories";
import { activeBrandForUser } from "@/server/workspace/active";
import { brandSpecSchema } from "@/server/brand/spec";
import { Badge, buttonClass, cardClass, EmptyState, isHex, Notice, PageHeader, SectionHeading, Swatch } from "@/components/ui/primitives";
import { CheckIcon, ChevronRight, SwatchIcon, UploadIcon } from "@/components/ui/icons";
import { approveVersion, extractFixture, uploadGuideline, uploadLogo } from "./actions";

type PageProps = { searchParams: Promise<{ message?: string }> };
export default async function BrandProfilePage({ searchParams }: PageProps) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const versions = listBrandSpecVersions(db, brand.id);
  const message = (await searchParams).message;
  const logo = db.prepare("SELECT filename, created_at FROM brand_assets WHERE brand_id = ? AND kind = 'logo' ORDER BY created_at DESC LIMIT 1").get(brand.id) as { filename: string; created_at: string } | undefined;
  const sourceName = (t: string) => (t === "fixture" ? "Sample guideline" : /upload/i.test(t) ? "Uploaded guideline" : "Guideline");
  const statusName = (t: string) => (t === "approved" ? "Approved" : t === "draft" || t === "pending" || t === "extracted" ? "Waiting for your approval" : t.charAt(0).toUpperCase() + t.slice(1).replaceAll("_", " "));
  return <main className="anim-rise mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader description="Rules are only active after explicit approval." eyebrow="Brand profile" title={`${brand.name} brand specification`}>
      <p className="mt-3"><Badge tone="success">Active version {brand.brand_version}</Badge></p>
    </PageHeader>
    {message && <Notice role="status">{message}</Notice>}
    <section aria-labelledby="add-heading" className={`mt-8 ${cardClass} p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold tracking-tight" id="add-heading">Add guideline</h2>
      <p className="mt-1 text-sm text-muted">Upload a brand guideline as a Markdown file and Markpath finds the rules in it for you to review. PDF files are not supported yet.</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form action={extractFixture.bind(null, brand.id)} className="flex min-w-0 flex-col justify-between gap-3 rounded-control border border-border bg-subtle/60 p-4"><div><p className="text-sm font-medium">Try the sample</p><p className="text-sm text-muted">The Nexa guideline, ready to review.</p></div><div><button className={buttonClass("primary")} type="submit">Load the Nexa sample guideline</button></div></form>
        <form action={uploadGuideline.bind(null, brand.id)} className="flex min-w-0 flex-col justify-between gap-3 rounded-control border border-dashed border-border-strong p-4"><label className="grid gap-1.5 text-sm font-medium" htmlFor="guideline">Your guideline (Markdown)<input accept=".md,text/markdown" className="w-full min-w-0" id="guideline" name="guideline" required type="file" /></label><div><button className={buttonClass("secondary")} type="submit"><UploadIcon />Upload Markdown</button></div></form>
      </div>
    </section>
    <section aria-labelledby="history-heading" className="mt-10">
      <SectionHeading count={versions.length} id="history-heading" title="Review and history" />
      <div className="mt-3 grid gap-4">{versions.length === 0 ? <EmptyState icon={<SwatchIcon size={20} />} title="No specification yet">Load the sample guideline or upload your own to create a draft you can review.</EmptyState> : versions.map((record, idx) => { const spec = brandSpecSchema.parse(JSON.parse(record.specification)); const approved = record.status === "approved";
        const body = <dl className="grid gap-px overflow-hidden rounded-control border border-border bg-border sm:grid-cols-2">{spec.rules.map((rule) => <div className="bg-surface p-3" key={rule.id}><dt className="text-xs font-medium uppercase tracking-wide text-muted">{rule.label}</dt><dd className="mt-1 flex items-center gap-2 font-medium">{isHex(rule.expected) && <Swatch className="h-5 w-5 rounded-md" value={rule.expected} />}<span className={isHex(rule.expected) || /^\d+(px|rem)$/.test(rule.expected) ? "font-mono text-[0.9375rem]" : ""}>{rule.expected}</span></dd><dd className="mt-1 text-xs text-muted">{approved ? "Approved" : "Waiting for your approval"} · {rule.sourceReference}</dd></div>)}</dl>;
        const head = <><div className="min-w-0"><h3 className="flex flex-wrap items-center gap-2 font-semibold">Version {record.version}<Badge tone={approved ? "success" : "brand"}>{statusName(record.status)}</Badge></h3><p className="mt-0.5 text-sm text-muted">{sourceName(record.source_type)} · {new Date(record.created_at).toLocaleString()}</p></div></>;
        if (idx > 0 && approved) return <details className={cardClass} key={record.id}><summary className="flex min-h-14 cursor-pointer items-center gap-3 rounded-card px-4 py-3 hover:bg-subtle/60 sm:px-5"><ChevronRight className="chev shrink-0 text-muted" />{head}</summary><div className="border-t border-border p-4 sm:p-5">{body}</div></details>;
        return <article className={`${cardClass} p-4 sm:p-5 ${approved ? "" : "border-brand/40 ring-4 ring-brand/5"}`} key={record.id}><div className="flex flex-wrap items-start justify-between gap-3">{head}{!approved && <form action={approveVersion.bind(null, brand.id, record.id)}><button className={buttonClass("primary")} type="submit"><CheckIcon />Approve this specification</button></form>}</div><div className="mt-4">{body}</div></article>; })}</div>
    </section>
    <section aria-labelledby="logo-heading" className={`mt-10 ${cardClass} p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold tracking-tight" id="logo-heading">Reference logo</h2>
      <p className="mt-1 text-sm text-muted">Upload the approved logo (PNG, JPG or WebP, up to 1 MB). The Design agent compares logos it finds in designs against it and flags doubts for a person; it never changes a logo.</p>
      {logo && <p className="mt-3 flex flex-wrap items-center gap-2 text-sm"><Badge tone="success">Current</Badge><strong className="font-medium">{logo.filename}</strong><span className="text-muted">uploaded {new Date(logo.created_at).toLocaleString()}</span></p>}
      <form action={uploadLogo.bind(null, brand.id)} className="mt-4 flex flex-wrap items-center gap-3"><label className="sr-only" htmlFor="logo">Logo file</label><input accept="image/png,image/jpeg,image/webp" className="w-full min-w-0 sm:w-auto" id="logo" name="logo" type="file" /><button className={buttonClass("secondary")} type="submit"><UploadIcon />Upload logo</button></form>
    </section>
  </main>;
}
