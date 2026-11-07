import { PageHeader } from "@/components/ui/primitives";
import { WorkspaceForm } from "./workspace-form";

export default function NewWorkspacePage() {
  return <main className="anim-rise">
    <PageHeader description="A workspace holds one brand: its rules, connections, chat room and history." title="New workspace" />
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 lg:py-16">
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-base font-semibold tracking-tight">Set up a brand workspace</h2>
        <p className="mb-5 mt-1 text-sm text-muted">You can create more and switch between them from the sidebar.</p>
        <WorkspaceForm />
      </div>
    </div>
  </main>;
}
