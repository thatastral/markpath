# Slice 6: QA verifier

Goal: independently re-read fixture resources after execution and record whether the intended values changed, legacy values are absent, and Git scope stayed focused.

Done when: Git and Figma fixture verification produce explicit evidence; verification rejects stale/incorrect resources; task-resource evidence can drive completion.

Files: QA verifier, tests, documentation/progress updates.

Steps: inspect the fixture working copy independently; check intended and old values; check Git diff scope; write a verification execution record; test successful fixture verification.

Tests: approved fixture execution followed by independent verification.

Risks / stubs: verification applies to local fixture workspaces only. It does not validate a live GitHub PR or a real Figma file.
