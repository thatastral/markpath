# Slice 5: Fixture executors

Goal: approved fixture operations can make narrow, auditable GitHub-style and Figma-style changes while every unapproved request is rejected.

Done when: executor rejects absent/mismatched approval; GitHub fixture uses a dedicated local branch and commit; Figma fixture is re-read after edit; execution evidence records fixture mode.

Files: fixture executor service and refusal tests.

Steps: enforce operation fingerprint; create local fixture repo/branch/commit; edit working Figma snapshot; persist evidence.

Tests: both executors refuse unapproved operations.

Risks / stubs: GitHub PR records are local simulation, not GitHub PRs. Figma edits affect a JSON working copy, not a Figma file.
