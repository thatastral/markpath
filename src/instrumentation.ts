export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") { const { startPrWatcher } = await import("./server/integrations/pr-watch-loop"); startPrWatcher(); }
}
