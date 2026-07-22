> Companion to [docs-reference-register.md](./docs-reference-register.md) — Upmind-monorepo-specific bindings/examples.

# Reference & register docs — Upmind bindings

## The governing decision record

The "governing decision record" the base rule cites is **ADR-019 (Module Documentation Shape)**. Cite ADR-019; do not restate it.

## The drift incident

The base rule's warning about colliding copies of the "same" record is the concrete ADR-019 incident: **three colliding ADR-019s drifted** because the register paraphrased and duplicated the decision instead of citing it once.

## Gate bindings (docs-corpus-gate.mjs)

Machine-readable bindings `ci/docs-corpus-gate.mjs` reads from this companion (resolved via `git rev-parse --show-toplevel` → `.claude/rules/`, mirroring `hooks/seat-guard.sh`). No env-var channel exists; absent this section the gate uses its generic defaults (ADR dir `docs/adr`; empty impl-status list, so that check is skipped; generic auth/url A7 regexes; generic capability-doc globs).

- adr-dir: docs/adr
- adr-impl-status: 001,022
- capability-globs: docs/reference/**/*.md,**/README.md,**/foundation.md
- a7-url-pattern: \b(?:recordedRequest|capturedRequest|outbound|sentRequest|request|req)\b[^\n;]*\.url\b
- a7-auth-pattern: \b(?:authorization|x-acting-as|acting[-_]?as|actingAs|sessionToken|session[-_]?token)\b
