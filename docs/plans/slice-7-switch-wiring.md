# Slice 7: Switch wiring

Goal: Markpath has a reproducible four-agent operations-room template, authenticated agent-tool boundary, and Switch health adapter ready for live configuration.

Done when: the YAML defines all four roles/room; the backend rejects missing agent tokens; a fake Switch client passes health tests; setup docs explain exact live validation requirements.

Files: Switch client, agent tool route, room template, tests, setup/decision docs.

Steps: define a small SwitchClient interface; add a local health implementation/fake; add token-authenticated spec tool; create the Console template; document the live validation checkpoint.

Tests: fake health client and token authorization boundary.

Risks / stubs: no real Switch server or agent reply is tested until Docker/Console finish installation. The UI must remain Not connected.
