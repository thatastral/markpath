# Slice 2: Brand specification

Goal: a workspace can ingest the Nexa guideline fixture, review a source-linked extracted specification, approve it, and retain version history.

Done when: fixture extraction creates a reviewable version; each rule has source/status metadata; approval updates the active brand specification; version history persists; extraction tests pass.

Files: fixture guideline, brand schema/repositories/services, brand profile route/components, and tests.

Steps: add version/guideline records; implement deterministic Markdown extraction; add local upload/fixture ingestion; add approval and history UI; test parser and approval persistence.

Tests: deterministic fixture extraction and approved-version persistence.

Risks / stubs: fixture Markdown extraction is labelled `fixture extraction`. General PDF/LLM extraction is deferred; no missing rule is inferred.
