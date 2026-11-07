"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GithubIcon, SpinnerIcon } from "@/components/ui/icons";

type Flow = { userCode: string; verificationUri: string; interval: number };
type Repo = { fullName: string; private: boolean };
const button = "inline-flex min-h-10 items-center gap-2 rounded-control border border-border-strong bg-surface px-3 text-sm font-medium shadow-card hover:bg-subtle disabled:opacity-60";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init); const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status}).`);
  return data;
}

export function GithubConnect({ login, repo }: { login: string | null; repo: string | null }) {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow | null>(null); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<Repo[] | null>(null); const [choice, setChoice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { if (!login) api<{ pending: Flow | null }>("/api/integrations/github/start").then((r) => { if (r.pending) void connect(r.pending); }).catch(() => undefined); return () => { if (timer.current) clearTimeout(timer.current); }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect(resume?: Flow) {
    setError(null); setBusy(true);
    try {
      const started = resume ?? await api<Flow>("/api/integrations/github/start", { method: "POST" }); setFlow(started);
      const poll = async () => {
        try {
          const result = await api<{ status: string }>("/api/integrations/github/poll", { method: "POST" });
          if (result.status === "connected") { setFlow(null); setBusy(false); router.refresh(); return; }
          if (result.status === "expired" || result.status === "denied") { setFlow(null); setBusy(false); setError(result.status === "denied" ? "GitHub sign-in was declined." : "The code expired. Start again."); return; }
          timer.current = setTimeout(poll, (started.interval + (result.status === "slow_down" ? 5 : 0)) * 1000);
        } catch (e) { setFlow(null); setBusy(false); setError(e instanceof Error ? e.message : "Could not check GitHub."); }
      };
      timer.current = setTimeout(poll, started.interval * 1000);
    } catch (e) { setBusy(false); setError(e instanceof Error ? e.message : "Could not start GitHub sign-in."); }
  }
  async function loadRepos() { setError(null); setBusy(true); try { const r = await api<{ repos: Repo[] }>("/api/integrations/github/repos"); setRepos(r.repos); setChoice(r.repos[0]?.fullName ?? ""); } catch (e) { setError(e instanceof Error ? e.message : "Could not list repositories."); } setBusy(false); }
  async function select() { setError(null); setBusy(true); try { const r = await api<{ repo: string }>("/api/integrations/github/select", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repo: choice }) }); setMessage(`Using ${r.repo}. The next audit reads this repository and opens a real pull request.`); setRepos(null); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Could not select that repository."); } setBusy(false); }
  async function demoRepo() { setError(null); setBusy(true); setMessage("Creating a private sample repository…"); try { const r = await api<{ repo: string }>("/api/integrations/github/demo-repo", { method: "POST" }); setMessage(`Created and selected ${r.repo}.`); router.refresh(); } catch (e) { setMessage(null); setError(e instanceof Error ? e.message : "Could not create the sample repository."); } setBusy(false); }
  async function disconnect() { setBusy(true); try { await api("/api/integrations/github/disconnect", { method: "POST" }); setMessage(null); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Could not disconnect."); } setBusy(false); }

  return <div className="mt-4 grid gap-3 text-sm">
    {!login && !flow && <div><p className="mb-3 text-muted">Connect GitHub so approved brand fixes open as real pull requests. Markpath never merges and never touches the default branch.</p><button className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand-solid px-4 text-sm font-medium text-white shadow-card hover:bg-brand-solid-hover disabled:opacity-60" disabled={busy} onClick={() => connect()} type="button"><GithubIcon />Connect GitHub</button></div>}
    {flow && <div className="anim-rise rounded-control border border-brand/40 bg-brand-soft p-4"><p>1. Open <a className="font-medium text-brand underline underline-offset-4" href={flow.verificationUri} rel="noreferrer" target="_blank">{flow.verificationUri}</a></p><p className="mt-1">2. Enter this code: <strong className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-base tracking-widest">{flow.userCode}</strong></p><p className="mt-3 flex items-center gap-2 text-muted"><SpinnerIcon className="text-brand" />Waiting for you to approve on GitHub…</p></div>}
    {login && <div><p>Signed in as <strong>{login}</strong>{repo ? <> · repository <strong>{repo}</strong></> : " · no repository chosen yet"}.</p>
      <div className="mt-2 flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={loadRepos} type="button">{repo ? "Change repository" : "Choose a repository"}</button><button className={button} disabled={busy} onClick={demoRepo} type="button">Create a sample repo to try it</button><button className="inline-flex min-h-10 items-center rounded-control px-3 text-sm font-medium text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-60" disabled={busy} onClick={disconnect} type="button">Disconnect</button></div>
      {repos && <div className="mt-2 flex flex-wrap items-center gap-2">{repos.length ? <><label className="sr-only" htmlFor="gh-repo">Repository</label><select className="min-w-0 max-w-full rounded-control border border-border-strong bg-surface px-2 py-2 text-sm" id="gh-repo" onChange={(e) => setChoice(e.target.value)} value={choice}>{repos.map((r) => <option key={r.fullName} value={r.fullName}>{r.fullName}{r.private ? " (private)" : ""}</option>)}</select><button className={button} disabled={busy || !choice} onClick={select} type="button">Use this repository</button></> : <p className="text-muted">No repositories with push access found.</p>}</div>}</div>}
    {message && <p className="text-muted" role="status">{message}</p>}{error && <p className="text-danger" role="alert">{error}</p>}
  </div>;
}
