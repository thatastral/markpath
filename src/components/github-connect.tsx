"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GithubIcon, SpinnerIcon } from "@/components/ui/icons";
import { buttonClass, inputClass } from "@/components/ui/primitives";

type Flow = { userCode: string; verificationUri: string; interval: number };
type Repo = { fullName: string; private: boolean };
type Job = "connect" | "repos" | "select" | "demo" | "disconnect";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init); const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `GitHub didn't respond (error ${response.status}). Try again.`);
  return data;
}

/** Label and pending label share one grid cell, so the button keeps its width while it works. */
function Busy({ on, children, pending }: { on: boolean; children: ReactNode; pending: ReactNode }) {
  return <span className="grid">
    <span className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${on ? "invisible" : ""}`}>{children}</span>
    <span className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${on ? "" : "invisible"}`}><SpinnerIcon size={14} />{pending}</span>
  </span>;
}

export function GithubConnect({ login, repo }: { login: string | null; repo: string | null }) {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow | null>(null); const [job, setJob] = useState<Job | null>(null); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<Repo[] | null>(null); const [choice, setChoice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = job !== null;
  useEffect(() => { if (!login) api<{ pending: Flow | null }>("/api/integrations/github/start").then((r) => { if (r.pending) void connect(r.pending); }).catch(() => undefined); return () => { if (timer.current) clearTimeout(timer.current); }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect(resume?: Flow) {
    setError(null); setJob("connect");
    try {
      const started = resume ?? await api<Flow>("/api/integrations/github/start", { method: "POST" }); setFlow(started);
      const poll = async () => {
        try {
          const result = await api<{ status: string }>("/api/integrations/github/poll", { method: "POST" });
          if (result.status === "connected") { setFlow(null); setJob(null); router.refresh(); return; }
          if (result.status === "expired" || result.status === "denied") { setFlow(null); setJob(null); setError(result.status === "denied" ? "GitHub sign-in was declined. Select Connect GitHub to try again." : "That code expired. Select Connect GitHub to get a new one."); return; }
          timer.current = setTimeout(poll, (started.interval + (result.status === "slow_down" ? 5 : 0)) * 1000);
        } catch (e) { setFlow(null); setJob(null); setError(e instanceof Error ? e.message : "Couldn't reach GitHub. Check your connection and try again."); }
      };
      timer.current = setTimeout(poll, started.interval * 1000);
    } catch (e) { setJob(null); setError(e instanceof Error ? e.message : "Couldn't start GitHub sign-in. Try again."); }
  }
  async function loadRepos() { setError(null); setJob("repos"); try { const r = await api<{ repos: Repo[] }>("/api/integrations/github/repos"); setRepos(r.repos); setChoice(r.repos[0]?.fullName ?? ""); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't load your repositories. Try again."); } setJob(null); }
  async function select() { setError(null); setJob("select"); try { const r = await api<{ repo: string }>("/api/integrations/github/select", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repo: choice }) }); setMessage(`Now using ${r.repo}. Approved fixes open as pull requests there.`); setRepos(null); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't select that repository. Try again."); } setJob(null); }
  async function demoRepo() { setError(null); setJob("demo"); setMessage(null); try { const r = await api<{ repo: string }>("/api/integrations/github/demo-repo", { method: "POST" }); setMessage(`Created ${r.repo} and selected it.`); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't create the sample repository. Try again."); } setJob(null); }
  async function disconnect() { setJob("disconnect"); try { await api("/api/integrations/github/disconnect", { method: "POST" }); setMessage(null); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't disconnect. Try again."); } setJob(null); }

  return <div className="grid gap-3 text-sm">
    {!login && !flow && <div><p className="mb-3 text-muted">Approved fixes open as pull requests. Markpath never merges them and never touches your main branch.</p><button aria-busy={job === "connect" || undefined} className={buttonClass("primary")} data-autofocus disabled={busy} onClick={() => connect()} type="button"><Busy on={job === "connect"} pending="Opening GitHub…"><GithubIcon />Connect GitHub</Busy></button></div>}
    {flow && <div className="anim-rise rounded-control border border-border bg-subtle p-4">
      <ol className="grid gap-2">
        <li><span className="tabular-nums text-muted">1.</span> Open <a className="font-medium text-brand underline underline-offset-4" href={flow.verificationUri} rel="noreferrer" target="_blank">{flow.verificationUri.replace(/^https?:\/\//, "")}<span className="sr-only"> (opens in a new tab)</span></a></li>
        <li className="flex flex-wrap items-center gap-x-2 gap-y-1"><span><span className="tabular-nums text-muted">2.</span> Enter this code:</span><strong className="select-all rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-base tabular-nums tracking-widest">{flow.userCode}</strong></li>
      </ol>
      <p className="mt-3 flex items-center gap-2 text-muted" role="status"><SpinnerIcon className="text-brand" />Waiting for you to approve on GitHub…</p>
    </div>}
    {login && <div><p className="min-w-0">Signed in as <strong className="font-medium">{login}</strong>{repo ? <> · <span className="text-muted">repository</span> <strong className="font-medium">{repo}</strong></> : <span className="text-muted"> · choose a repository next</span>}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button aria-busy={job === "repos" || undefined} className={buttonClass(repo ? "secondary" : "primary")} data-autofocus={repo ? undefined : true} disabled={busy} onClick={loadRepos} type="button"><Busy on={job === "repos"} pending="Loading…">{repo ? "Change repository" : "Choose a repository"}</Busy></button>
        <button aria-busy={job === "demo" || undefined} className={buttonClass("secondary")} disabled={busy} onClick={demoRepo} type="button"><Busy on={job === "demo"} pending="Creating…">Create a sample repository</Busy></button>
        <button aria-busy={job === "disconnect" || undefined} className={buttonClass("danger")} disabled={busy} onClick={disconnect} type="button"><Busy on={job === "disconnect"} pending="Disconnecting…">Disconnect</Busy></button>
      </div>
      {repos && <div className="anim-rise mt-3 flex flex-wrap items-center gap-2">{repos.length ? <><label className="sr-only" htmlFor="gh-repo">Repository</label><select autoFocus className={`${inputClass} w-auto max-w-full sm:max-w-sm`} id="gh-repo" onChange={(e) => setChoice(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && choice && !busy) { e.preventDefault(); void select(); } }} value={choice}>{repos.map((r) => <option key={r.fullName} value={r.fullName}>{r.fullName}{r.private ? " (private)" : ""}</option>)}</select><button aria-busy={job === "select" || undefined} className={buttonClass("primary")} disabled={busy || !choice} onClick={select} type="button"><Busy on={job === "select"} pending="Saving…">Use this repository</Busy></button></> : <p className="text-muted">No repositories you can push to. Create a sample repository, or check your access on GitHub.</p>}</div>}</div>}
    {message && <p className="anim-rise text-muted" role="status">{message}</p>}{error && <p className="anim-rise text-danger" role="alert">{error}</p>}
  </div>;
}
