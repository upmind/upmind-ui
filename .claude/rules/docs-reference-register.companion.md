---
paths:
  - 'docs/reference/**/*.md'
  - 'docs/adr/**/*.md'
---
> Companion to `docs-reference-register.md` — Upmind-monorepo bindings.

## The governing decision record

ADR-019 (Module Documentation Shape). Cite it; never restate or duplicate it — a paraphrased copy drifts.

## Gate bindings (docs-corpus-gate.mjs)

Read by `ci/docs-corpus-gate.mjs`. Absent, the gate uses its generic defaults.

- adr-dir: docs/adr
- adr-impl-status: 001,022
- adrImplStatus: 001,022
- capability-globs: docs/reference/**/*.md,**/README.md,**/foundation.md
- a7-url-pattern: \b(?:recordedRequest|capturedRequest|outbound|sentRequest|request|req)\b[^\n;]*\.url\b
- a7-auth-pattern: \b(?:authorization|x-acting-as|acting[-_]?as|actingAs|sessionToken|session[-_]?token)\b
