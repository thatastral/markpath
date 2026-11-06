# Slice 4: Deterministic audit engines

Goal: local Nexa Figma and web fixtures produce evidence-backed, classified brand findings without an LLM deciding compliance.

Done when: both fixture scanners detect the old blue, Inter, and 4px radius; findings include detected/expected/evidence/severity/confidence/classification; compliant values are not reported as violations.

Files: Nexa web/Figma fixtures, scanner modules, scanner tests.

Steps: create transparent old-brand fixtures; scan known token/value patterns; return normalized findings; test confirmed and compliant paths.

Tests: scanner expectations against the fixture files.

Risks / stubs: these scans are explicitly fixture mode. Real GitHub/Figma adapters are not connected.
