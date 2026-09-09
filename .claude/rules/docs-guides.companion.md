---
paths:
  - 'docs/learn/**/*.md'
  - '**/README.md'
  - '**/docs/guide.md'
  - '**/docs/guides/**/*.md'
  - '**/guides/**/*.md'
---
> Companion to [docs-guides.md](./docs-guides.md) — Upmind-monorepo-specific bindings/examples.

# Guide writing — Upmind bindings

## Guide personas (concrete)

The base rule's neutral personas map to Upmind's cart/portal audiences:

| Persona | Description | Needs | Tone |
|---------|-------------|-------|------|
| **External Developer** | Building custom cart/portal | Working code, clear steps | Technical but accessible |
| **Solution Architect** | Evaluating platform capabilities | Overview, integration points | Strategic, feature-focused |
| **Technical Partner** | Integrating Upmind into their product | API patterns, best practices | Professional, thorough |
| **Power User** | Reseller wanting customization | Achievable outcomes, no jargon | Friendly, outcome-oriented |

## Guide location (concrete path)

A single-module guide lives with its module, at `packages/headless/src/modules/<name>/docs/guide.md` — `auth`, `brand` and `system` are the three that exist. A guide only earns a package-level home when it is genuinely cross-cutting; none is today, so `packages/headless/docs/guides/` does not exist.

The corpus reads every module's `docs/` set, so a guide there is indexed wherever it sits. The three used to live inside typedoc's output directory, where a regeneration could wipe them (MR !566).
