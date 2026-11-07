import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { listBrandSpecVersions } from "@/server/db/repositories";
import { activeBrandForUser } from "@/server/workspace/active";
import { brandSpecSchema } from "@/server/brand/spec";
import { whenText } from "@/lib/labels";
import { Badge, bodyClass, buttonClass, cardClass, EmptyState, isHex, Notice, PageHeader, SectionHeading, Swatch } from "@/components/ui/primitives";
import { CheckIcon, ChevronRight, SwatchIcon, UploadIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { FileDrop } from "@/components/ui/file-drop";
import { approveVersion, extractFixture, uploadGuideline, uploadLogo } from "./actions";

type PageProps = { searchParams: Promise<{ message?: string }> };
import { pageTitle } from "../page-title";
export async function generateMetadata() { return { title: await pageTitle("Brand rules") }; }

export default async function BrandProfilePage({ searchParams }: PageProps) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const versions = listBrandSpecVersions(db, brand.id);
  const message = (await searchParams).message;
  const logo = db.prepare("SELECT filename, created_at FROM brand_assets WHERE brand_id = ? AND kind = 'logo' ORDER BY created_at DESC LIMIT 1").get(brand.id) as { filename: string; created_at: string } | undefined;
  const sourceName = (t: string) => (t === "fixture" ? "Sample guideline" : /upload/i.test(t) ? "Uploaded guideline" : "Guideline");
  const statusName = (t: string) => (t === "approved" ? "In use" : t === "superseded" ? "Replaced" : t === "draft" || t === "pending" || t === "extracted" ? "Waiting for your approval" : t.charAt(0).toUpperCase() + t.slice(1).replaceAll("_", " "));
  const categoryName = (c: string) => ({ colour: "Colour", typography: "Type", component: "Component", logo: "Logo", voice: "Voice", accessibility: "Accessibility" } as Record<string, string>)[c] ?? c;
  return <main className="anim-rise">
    <PageHeader actions={<Badge tone="success"><span className="tabular-nums">Version {brand.brand_version}</span> active</Badge>} description="The agents check everything against the version you approve." title="Brand rules" />
    <div className={bodyClass}>
    {message && <div className="mb-6"><Notice role="status">{message}</Notice></div>}
    <section aria-labelledby="history-heading">
      <SectionHeading count={versions.length} description="Each version lists the values the agents expect." id="history-heading" title="Versions" />
      <div className="mt-4 grid gap-4">{versions.length === 0 ? <EmptyState framed icon={<SwatchIcon size={28} />} title="No brand rules yet">Add your guideline, check the values Markpath finds, and save them.</EmptyState> : versions.map((record, idx) => { const spec = brandSpecSchema.parse(JSON.parse(record.specification)); const approved = record.status === "approved";
        const body = <div role="table" aria-label={`Version ${record.version} rules`}>
          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)] gap-4 border-b border-border bg-subtle px-4 py-2 text-xs font-medium text-muted sm:grid sm:px-5" role="row"><span role="columnheader">Rule</span><span role="columnheader">Value</span><span role="columnheader">Source</span></div>
          {spec.rules.map((rule) => <div className="grid gap-x-4 gap-y-1 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)] sm:items-center sm:px-5" key={rule.id} role="row">
            <span className="min-w-0" role="cell"><span className="block text-sm font-medium">{rule.label}</span><span className="block text-xs text-muted">{categoryName(rule.category)}</span></span>
            <span className="flex min-w-0 items-center gap-2.5" role="cell">{isHex(rule.expected) && <Swatch className="h-6 w-6 rounded-md" value={rule.expected} />}<span className={`min-w-0 text-sm ${isHex(rule.expected) || /^\d+(px|rem)$/.test(rule.expected) ? "font-mono" : ""}`}>{rule.expected}</span></span>
            <span className="min-w-0 text-xs text-muted" role="cell">{rule.sourceReference}<span className="sr-only"> · {approved ? "Approved" : "Waiting for your approval"}</span></span>
          </div>)}
        </div>;
        const head = <div className="min-w-0 flex-1"><h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">Version {record.version}<Badge tone={approved ? "success" : "brand"}>{statusName(record.status)}</Badge></h3><p className="mt-0.5 text-xs tabular-nums text-muted">{sourceName(record.source_type)} · {whenText(record.created_at)} · {spec.rules.length} rules</p></div>;
        if (idx > 0 && approved) return <details className={`overflow-hidden ${cardClass}`} key={record.id}><summary className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 hover:bg-hover sm:px-5"><ChevronRight className="chev shrink-0 text-muted" size={14} />{head}</summary><div className="border-t border-border">{body}</div></details>;
        return <article className={`relative overflow-hidden ${cardClass}`} key={record.id}>{!approved && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand-solid" />}<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">{head}{!approved && <form action={approveVersion.bind(null, brand.id, record.id)}><SubmitButton className={buttonClass("primary")} pendingLabel="Approving…"><CheckIcon size={14} />Approve these rules</SubmitButton></form>}</div>{body}</article>; })}</div>
    </section>
    <section aria-labelledby="add-heading" className="mt-10">
      <SectionHeading description="From a PDF, Markdown file, your website or a design link. You check the values before they're saved as a new version." id="add-heading" title="Update brand rules" />
      <div className={`mt-4 ${cardClass} flex min-w-0 flex-wrap items-center justify-between gap-4 p-5`}>
        <p className="min-w-0 text-sm text-muted">{versions.length ? "Edit the current values, or read them again from a new guideline." : "Add your guideline to get started."}</p>
        <span className="flex flex-wrap gap-2">{versions.length > 0 && <Link className={buttonClass("secondary")} href="/onboarding?step=brand&edit=1">Edit rules</Link>}<Link className={buttonClass("primary")} href="/onboarding?step=brand&new=1"><UploadIcon size={14} />{versions.length ? "Add a new guideline" : "Add your guideline"}</Link></span>
      </div>
    </section>
    <section aria-labelledby="logo-heading" className="mt-10">
      <SectionHeading description="The Design agent compares logos in your designs with this one and flags doubts for you. It never changes a logo." id="logo-heading" title="Reference logo" />
      <div className={`mt-4 ${cardClass} p-5`}>
        {logo ? <p className="flex flex-wrap items-center gap-2 text-sm"><Badge tone="success">Current</Badge><strong className="font-medium">{logo.filename}</strong><span className="tabular-nums text-muted">uploaded {whenText(logo.created_at)}</span></p> : <p className="text-sm text-muted">No logo yet.</p>}
        <form action={uploadLogo.bind(null, brand.id)} className="mt-4 grid gap-3 sm:max-w-md"><label className="sr-only" htmlFor="logo">Logo file</label><FileDrop accept="image/png,image/jpeg,image/webp" hint="PNG, JPG or WebP, up to 1 MB." id="logo" maxBytes={1_000_000} name="logo" required /><div><SubmitButton className={buttonClass("secondary")} pendingLabel="Uploading…"><UploadIcon size={14} />Upload logo</SubmitButton></div></form>
      </div>
    </section>
    </div>
  </main>;
}
