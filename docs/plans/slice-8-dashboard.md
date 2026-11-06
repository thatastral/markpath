# Slice 8: dashboard

Goal: authenticated users can operate the Markpath fixture workflow through five evidence-led dashboard pages.

Done when:
- Overview shows workspace, evidence counts, and onboarding steps from persisted data.
- Integrations render their actual mode and status, with a live Switch health check only when requested.
- Issues and Approvals show findings and resource-bound approval decisions.
- Agent Activity shows persisted task and agent records, rather than invented activity.
- `npm run typecheck`, `npm test`, and `npm run build` pass.

Files: dashboard data queries; app navigation; overview, integrations, issues, and activity routes; approval action; progress log.

Steps:
1. Add focused read models for dashboard counts, findings, approvals, executions, and activities.
2. Replace the placeholder overview with transparent evidence and onboarding state.
3. Add the three missing routes and a resource-bound approval Server Action.
4. Add navigation/loading states, run checks, record progress, and commit the slice.

Tests: TypeScript, existing Vitest suites, and production build; browser smoke checks for every dashboard URL.

Risks / stubs: GitHub and Figma remain fixture adapters; Canva remains not connected. Switch is only marked connected after health plus a verified room reply, so a health response alone remains a partial setup state.
