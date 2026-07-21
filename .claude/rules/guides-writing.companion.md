> Companion to [guides-writing.md](./guides-writing.md) — Upmind-monorepo-specific bindings/examples.

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

The `<package>/docs/guides/` home is, in this monorepo, `packages/headless/docs/guides/` — package-level, not per-module. Module docs it links to live at `packages/headless/src/modules/<name>/docs/README.md`.
