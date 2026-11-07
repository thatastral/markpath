# Keep the agents running without your laptop, and without your personal login

What Switch's docs say (https://docs.switchagents.ai/switch-rooms/getting-started/what-keeps-your-agent-running and https://docs.switchagents.ai/switch-rooms/deploy/host-remotely):

- An agent answers only while something holds its connection. If Switch Console runs it on your computer, quitting Console stops it.
- An agent can run on a **remote host** (Linux Ubuntu 22.04 or 24.04, or macOS; about 2 vCPU, 4 GB RAM, 20 GB disk; SSH access; outbound internet). Switch Console puts a small process there, so the agent keeps answering after you close your laptop. A host reboot stops it until Console reaches the host again. On a server with agent management, a **managed machine** controller keeps it running instead.
- **Sign in to the agent provider on the host yourself.** Console installs the provider's CLI but does not sign it in. The agent works with the access that machine has, so the Figma and Canva connectors and `~/.markpath` style files must exist on that host, not on your laptop.

For a team, this means the Design agent's Figma and Canva connections belong to whichever account is signed in on the host. Use a dedicated account for that, not a person's.

**API key instead of a personal subscription (not covered by Switch's docs).** Claude Code, which the Claude agents run on, can authenticate with an `ANTHROPIC_API_KEY` environment variable on the host. Billing then goes to the organisation and the team does not depend on one person's login. Switch's documentation does not describe this setup, so test it on a host before promising it: confirm the agent answers in a room and that the Figma and Canva connectors still work under that login. Also check your provider's terms before sharing one personal subscription across a team.

Markpath itself never sees any provider credential.
