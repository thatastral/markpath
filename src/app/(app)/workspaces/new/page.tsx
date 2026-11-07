import { PageHeader } from "@/components/ui/primitives";
import { WorkspaceForm } from "./workspace-form";

export default function NewWorkspacePage() {
  return <main className="anim-rise mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10"><PageHeader description="A workspace holds one brand: its rules, connections, chat room and history. You can create more and switch between them." eyebrow="New workspace" title="Set up a brand workspace" /><div className="mt-6 rounded-card border border-border bg-surface p-4 shadow-card sm:p-6"><WorkspaceForm /></div></main>;
}
