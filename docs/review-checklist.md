# Handoff review checklist

1. Review `src/server/` boundaries, validation, session security, and approval binding.
2. Review fixture-versus-real labelling in integrations and execution records.
3. Verify the GitHub executor never touches the default branch or merges.
4. Verify Figma plugin approval checks and re-read-based verification.
5. Verify Switch room setup, mention handoffs, and agent-activity records.
6. Reproduce the README demo path from a clean clone.

## Added in the agent-API pass
- `src/server/agents/operations.ts`, `http.ts`, `auth.ts`; routes under `src/app/api/agent/`.
- `scripts/agent-tokens.mjs`; `tests/agent-api.test.ts` (end-to-end with enforced roles).
- Check: role enforcement, single-use approvals, no secrets in logs or the template, `room-event` honesty.
