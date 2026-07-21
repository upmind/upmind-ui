> Companion to [docs-reviews.md](./docs-reviews.md) — Upmind-monorepo-specific bindings/examples.

# Documentation review — Upmind bindings

The base rule uses neutral placeholder property names in its examples. In the Upmind monorepo the illustrative examples are concrete:

## Terminology-drift example

Same concept, one name everywhere: always `storeUrl`, never sometimes `storefront_url`. The corrected mustache syntax the copywriter shipped was `@data.storeUrl` / `@data.*.storeUrl`.

## Enum vs registration example

A template defined in the `SESSION_TEMPLATE` enum is **not** necessarily registered in `supportedTemplates` (the whitelist the `.vue` session pages actually accept). Always check both — Appendix B must cross-reference enum values against `supportedTemplates`.

## Audit slug example

A real source slug: `cart-2.0-notion-docs-review`.
