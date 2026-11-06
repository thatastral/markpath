# Switch Rooms integration guide (for slice 7)

Source: official docs, read 2026-11-04. Repo: https://github.com/sandbox-quantum/switch. Docs: https://docs.switchagents.ai/ (machine-readable index: https://docs.switchagents.ai/llms.txt). The docs call the repos "the current development line, not the released product": if something below disagrees with the docs, trust the docs and note it in `docs/decisions.md`. Docs MCP, if you can add one: `https://docs.switchagents.ai/mcp`.

## Concepts
- **Room:** one shared conversation mapped to one channel on a chat platform (Mattermost, Slack, Discord, Telegram, Teams). Append-only log; each message has a per-room `seq` starting at 1.
- **Agent:** registered once, has an owner and an `addressing` setting. Agents only see rooms they belong to.
- **Switch Console:** desktop app that runs local agents (Claude Code, Codex, OpenCode) and creates agents and rooms from templates. Local agents answer only while Console is running.
- Handoff between agents is just a message or @mention. There is no separate task protocol, so Markpath must track task state itself in its own DB.

## Local setup (needs Docker)
1. Install Docker Desktop and Switch Console (arm64 dmg from the GitHub release).
2. Console > Settings > Agent providers: expect "Signed in".
3. Add a server > "Run a server on this computer" > Start (first start downloads a few GB).
4. Bundled Mattermost: Home > Messaging apps > Mattermost > Sign-in details.
5. Templates > create agents + room. Mention an agent with `@exact-name`. Unaddressed messages get no reply and no error.
6. New agents answer only their owner until addressing is changed.

## Template YAML (agents + room in one file)
Reference: `examples/agent-templates/triage-pair.template.yaml`. Shape:
```yaml
version: 1
params:
  team: { type: string, description: Prefix for every name, pattern: "[a-z][a-z0-9-]*" }
  provider: { type: provider, default: [claude, codex, opencode], input: advanced }
  location: { type: location, default: local, input: advanced }
  directory: { type: directory, default: "{$agents_dir}/{agent}", input: advanced }
  bridge: { type: bridge, default: [$first] }
agents:
  - name: "{team}-director"
    description: ...
    addressing: anyone
    provider: "{provider}"
    location: "{location}"
    directory: "{directory}"
    instructions: |
      ...
room:
  name: "{team}-ops"
  bridge: "{bridge}"
  agents: ["{team}-director", "..."]
  users: ["{$creator}"]
  kickoff: |
    ...
```
Create one agent entry per Markpath agent (brand-director, design-agent, implementation-agent, brand-qa) with distinct instructions. The template used `addressing: owner-agents`, but the protocol docs say `owner_only | owner_and_owner_agents | anyone`. Use `anyone` for the Director and verify what Console accepts for the others. Template language reference: docs/TEMPLATES.md in the repo.

## Agent protocol (only needed for a custom agent or the Markpath bridge)
Base URL is the Switch server. `GET /health` is public. Auth: `Authorization: Bearer <agent API key>` (registration uses a registration key from the Gateway API Keys page).
- Register: `POST /agents` with `name` (`^[a-z0-9][a-z0-9._-]*$`), `description`, `connector_type`, `integration_profile` {connection_model, message_exchange, pre_invocation_mediation, post_invocation_mediation, event_reporting}. Returns `{id, api_key}` once. Do not use `/agents/register-known`.
- Addressing: `POST /agents/{id}/ops/update_agent_detail` `{"agent_id": "...", "addressing": "anyone"}`.
- **Inbound is a WebSocket**: `GET /agents/{id}/connection/ws?connection_id=<uuid>&rooms=<room_id>`. SSE is deprecated. Server sends `ping` every 2s; reply `{"type":"pong","cursor":<seq>}` within 6s or the connection lapses. First frame is `connection_state`. Act only on events where `payload.addressed` is true. Close codes: 4400 bad params, 4401 auth, 4403 room not servable, 4409 takeover/too many connections. `taken_over` is final: do not reconnect. Reuse the same `connection_id` on reconnect; reopening a live id takes it over, so two retrying clients can evict each other.
- Event frame: `{"event":"message","data":{"type":"message","room_id":"...","payload":{"addressed":true,"sender":"...","sender_name":"...","message_id":"...","body":"...","timestamp":0,"thread_id":null},"sequence":4813},"id":4813}`. Other payload types: `command`, `room_join`.
- Outbound: `GET /agents/{id}/ops` lists operations with schemas. `POST /agents/{id}/ops/{operation}` with header `X-Switch-Connection-Id`. Useful ops: `list_rooms`, `create_room`, `invite_agent_to_room`, `post_message`, `read_context`, `define_role`, `assume_role`, `list_agents`, `list_bridges`. `POST /agents/{id}/message {room_id, content}` posts without a connection.
- No client SDK exists for Switch Rooms. Implement the protocol yourself, in TypeScript.

## How Markpath should use it
- Each Markpath agent runs on a coding-agent runtime through Console, and calls Markpath's backend `/api/agent/*` tool API with a per-agent token (tools: get brand spec, run audit, propose change, request approval, execute approved op, verify). The agent instructions must tell it to call those tools, never to claim results it did not get from them.
- Handoffs are real @mentions in the room. The Director @mentions the Design and Implementation agents; QA is @mentioned after execution.
- Markpath's backend records each handoff in `agent_activity` with the Switch `message_id`/`sequence` as `message_reference`. The dashboard Integrations page only shows Switch "Connected" after a successful `/health` check and a verified agent reply in the room.
- Approvals: the chat may show an approval request, but the binding approval record is created by the dashboard or a signed approval endpoint, tied to the specific resource and operation.
- Build and test the backend behind a `SwitchClient` interface first, with a fake implementation for tests.

## Rough edges to expect
Docker must be running; first start is slow. Local server is single-user. The Switch expert may ask for a repo download that sits unanswered in a thread. Console telemetry is on by default (opt-out). Do not put secrets in room messages.
