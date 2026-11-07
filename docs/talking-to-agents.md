# Talking to the agents

Write the way you would to a colleague. You do not need exact phrases, and the agents understand follow-ups ("do the same for Canva", "and the poster?"). Mention an agent by name; the Director is the best default, and it hands work to the others.

| You write something like | What happens |
| --- | --- |
| "Is this on brand? <Figma, Canva or pull request link>" | A read-only review. Nothing is changed and no approval is created. Results appear in the room and on the dashboard Reviews page. |
| "What's wrong right now?", "status", "anything to approve?" | The Director reports open issues by tool, what is waiting for approval, and recent reviews. |
| "Fix these issues", "make the poster on brand", "clean this up" | The agents prepare the fixes and ask the owner to approve. Nothing changes until then. |
| "Yes", "go ahead", "approve changes", "ship it" (as an answer to the approval request) | Recorded as the owner's approval. Hedged or long replies ("yes but…") are not accepted: reply with just "approve" or "reject". |
| "What's our primary colour / font / voice rule?" | Answered from the approved brand specification. |
| "How do I connect Figma?" | A short answer and a link to the Integrations page. |
| "Is it really done?", "double check task …" | Brand QA re-reads the result independently. |

What nobody can do automatically: undo a change. A GitHub pull request can be closed; Figma and Canva keep version history.

If an agent says it cannot reach Figma or Canva, its session was started before that connector was added. Add the connector in claude.ai, then restart that agent's session (in Switch Console, or `/reset @name` in the room). The agents only see the tools they had when the session started.
