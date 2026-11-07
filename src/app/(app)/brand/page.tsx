import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { listBrandSpecVersions } from "@/server/db/repositories";
import { activeBrandForUser } from "@/server/workspace/active";
import { brandSpecSchema } from "@/server/brand/spec";
import { Badge, bodyClass, buttonClass, cardClass, EmptyState, isHex, Notice, PageHeader, SectionHeading, Swatch } from "@/components/ui/primitives";
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
  const categoryName = (c: string) => ({ colour: "Colour", typography: "Type", component: "Component", logo: "Logo", voice: "Voice", accessibility: "Accessibility" } as Record<string, string>)[c] ?? c;
  return <main className="anim-rise">
    <PageHeader actions={<Badge tone="success">Active version {brand.brand_version}</Badge>} description="Rules are only active after explicit approval." title={`${brand.name} brand kit`} />
    <div className={bodyClass}>
    {message && <div className="mb-6"><Notice role="status">{message}</Notice></div>}
    <section aria-labelledby="history-heading">
      <SectionHeading count={versions.length} description="Every rule the agents check against, with the value it expects." id="history-heading" title="Brand rules" />
      <div className="mt-4 grid gap-4">{versions.length === 0 ? <EmptyState framed icon={<SwatchIcon size={28} />} title="No specification yet">Load the sample guideline or upload your own to create a draft you can review.</EmptyState> : versions.map((record, idx) => { const spec = brandSpecSchema.parse(JSON.parse(record.specification)); const approved = record.status === "approved";
        const body = <div role="table" aria-label={`Version ${record.version} rules`}>
          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)] gap-4 border-b border-border bg-subtle px-4 py-2 text-xs font-medium text-muted sm:grid sm:px-5" role="row"><span role="columnheader">Rule</span><span role="columnheader">Value</span><span role="columnheader">Source</span></div>
          {spec.rules.map((rule) => <div className="grid gap-x-4 gap-y-1 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)] sm:items-center sm:px-5" key={rule.id} role="row">
            <span className="min-w-0" role="cell"><span className="block text-sm font-medium">{rule.label}</span><span className="block text-xs text-muted">{categoryName(rule.category)}</span></span>
            <span className="flex min-w-0 items-center gap-2.5" role="cell">{isHex(rule.expected) && <Swatch className="h-6 w-6 rounded-md" value={rule.expected} />}<span className={`min-w-0 text-sm ${isHex(rule.expected) || /^\d+(px|rem)$/.test(rule.expected) ? "font-mono" : ""}`}>{rule.expected}</span></span>
            <span className="min-w-0 text-xs text-muted" role="cell">{rule.sourceReference}<span className="sr-only"> · {approved ? "Approved" : "Waiting for your approval"}</span></span>
          </div>)}
        </div>;
        const head = <div className="min-w-0 flex-1"><h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">Version {record.version}<Badge tone={approved ? "success" : "brand"}>{statusName(record.status)}</Badge></h3><p className="mt-0.5 text-xs text-muted">{sourceName(record.source_type)} · {new Date(record.created_at).toLocaleString()} · {spec.rules.length} rules</p></div>;
        if (idx > 0 && approved) return <details className={`overflow-hidden ${cardClass}`} key={record.id}><summary className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 hover:bg-hover sm:px-5"><ChevronRight className="chev shrink-0 text-muted" size={14} />{head}</summary><div className="border-t border-border">{body}</div></details>;
        return <article className={`relative overflow-hidden ${cardClass}`} key={record.id}>{!approved && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand-solid" />}<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">{head}{!approved && <form action={approveVersion.bind(null, brand.id, record.id)}><button className={buttonClass("primary")} type="submit"><CheckIcon size={14} />Approve this specification</button></form>}</div>{body}</article>; })}</div>
    </section>
    <section aria-labelledby="add-heading" className="mt-10">
      <SectionHeading description="Upload a brand guideline as a Markdown file and Markpath finds the rules in it for you to review. PDF files are not supported yet." id="add-heading" title="Add guideline" />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <form action={extractFixture.bind(null, brand.id)} className={`${cardClass} flex min-w-0 flex-col justify-between gap-4 p-5`}><div><p className="text-sm font-medium">Try the sample</p><p className="mt-0.5 text-sm text-muted">The Nexa guideline, ready to review.</p></div><div><button className={buttonClass("primary")} type="submit">Load the Nexa sample guideline</button></div></form>
        <form action={uploadGuideline.bind(null, brand.id)} className={`${cardClass} flex min-w-0 flex-col justify-between gap-4 border-dashed border-border-strong p-5`}><label className="grid gap-2 text-sm font-medium" htmlFor="guideline">Your guideline (Markdown)<input accept=".md,text/markdown" className="w-full min-w-0" id="guideline" name="guideline" required type="file" /></label><div><button className={buttonClass("secondary")} type="submit"><UploadIcon size={14} />Upload Markdown</button></div></form>
      </div>
    </section>
    <section aria-labelledby="logo-heading" className="mt-10">
      <SectionHeading description="The Design agent compares logos it finds in designs against it and flags doubts for a person; it never changes a logo." id="logo-heading" title="Reference logo" />
      <div className={`mt-4 ${cardClass} p-5`}>
        {logo ? <p className="flex flex-wrap items-center gap-2 text-sm"><Badge tone="success">Current</Badge><strong className="font-medium">{logo.filename}</strong><span className="text-muted">uploaded {new Date(logo.created_at).toLocaleString()}</span></p> : <p className="text-sm text-muted">No logo yet. PNG, JPG or WebP, up to 1 MB.</p>}
        <form action={uploadLogo.bind(null, brand.id)} className="mt-4 flex flex-wrap items-center gap-3"><label className="sr-only" htmlFor="logo">Logo file</label><input accept="image/png,image/jpeg,image/webp" className="w-full min-w-0 sm:w-auto" id="logo" name="logo" type="file" /><button className={buttonClass("secondary")} type="submit"><UploadIcon size={14} />Upload logo</button></form>
      </div>
    </section>
    </div>
  </main>;
}
