import { WorkspaceForm } from "./workspace-form";

export default function NewWorkspacePage() {
  return <main className="mx-auto max-w-xl px-6 py-10"><p className="text-sm font-semibold text-brand">New workspace</p><h1 className="mt-2 text-2xl font-semibold">Set up a brand workspace</h1><p className="mt-2 text-sm text-muted">A workspace holds one brand: its rules, connections, chat room and history. You can create more and switch between them.</p><WorkspaceForm /></main>;
}
