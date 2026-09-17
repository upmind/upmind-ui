---
paths:
  - 'docs/learn/**/*.md'
  - '**/README.md'
  - '**/docs/guide.md'
  - '**/docs/guides/**/*.md'
  - '**/guides/**/*.md'
---
> Companion to `docs-guides.md` — Upmind-monorepo bindings.

## Guide personas

| Persona | Description | Needs | Tone |
|---------|-------------|-------|------|
| **External Developer** | Building custom cart/portal | Working code, clear steps | Technical but accessible |
| **Solution Architect** | Evaluating platform capabilities | Overview, integration points | Strategic, feature-focused |
| **Technical Partner** | Integrating Upmind into their product | API patterns, best practices | Professional, thorough |
| **Power User** | Reseller wanting customization | Achievable outcomes, no jargon | Friendly, outcome-oriented |

## Guide location

A single-module guide lives with its module: `packages/headless/src/modules/<name>/docs/guide.md`. A package-level home exists only for a genuinely cross-cutting guide; none does today. The corpus indexes every module's `docs/` set.
